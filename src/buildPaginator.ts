"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const utils_1 = require("./utils");
var Order;
(function (Order) {
    Order["ASC"] = "ASC";
    Order["DESC"] = "DESC";
})(Order = exports.Order || (exports.Order = {}));
class Paginator {
    constructor(entity, paginationKeys, paginationUniqueKey) {
        this.entity = entity;
        this.paginationKeys = paginationKeys;
        this.paginationUniqueKey = paginationUniqueKey;
        this.afterCursor = null;
        this.beforeCursor = null;
        this.nextAfterCursor = null;
        this.nextBeforeCursor = null;
        this.alias = utils_1.pascalToUnderscore(this.entity.name);
        this.limit = 100;
        this.order = Order.DESC;
    }
    setAlias(alias) {
        this.alias = alias;
    }
    setAfterCursor(cursor) {
        this.afterCursor = cursor;
    }
    setBeforeCursor(cursor) {
        this.beforeCursor = cursor;
    }
    setLimit(limit) {
        this.limit = limit;
    }
    setOrder(order) {
        this.order = order;
    }
    paginate(builder, limitBuilder) {
        return __awaiter(this, void 0, void 0, function* () {
            const entities = yield this.appendPagingQuery(builder, limitBuilder).getMany();
            const hasMore = entities.length > this.limit;
            if (hasMore) {
                entities.splice(entities.length - 1, 1);
            }
            if (entities.length === 0) {
                return this.toPagingResult(entities);
            }
            if (!this.hasAfterCursor() && this.hasBeforeCursor()) {
                entities.reverse();
            }
            if (this.hasBeforeCursor() || hasMore) {
                this.nextAfterCursor = this.encode(entities[entities.length - 1]);
            }
            if (this.hasAfterCursor() || (hasMore && this.hasBeforeCursor())) {
                this.nextBeforeCursor = this.encode(entities[0]);
            }
            return this.toPagingResult(entities);
        });
    }
    getCursor() {
        return {
            afterCursor: this.nextAfterCursor,
            beforeCursor: this.nextBeforeCursor,
        };
    }
    appendPagingQuery(builder, limitBuilder) {
        const cursors = {};
        if (this.hasAfterCursor()) {
            Object.assign(cursors, this.decode(this.afterCursor));
        }
        else if (this.hasBeforeCursor()) {
            Object.assign(cursors, this.decode(this.beforeCursor));
        }
        if (Object.keys(cursors).length > 0) {
            builder.andWhere(new typeorm_1.Brackets((where) => this.buildCursorQuery(where, cursors)));
        }
        if (limitBuilder) {
            const [sql, parameters] = limitBuilder.getQueryAndParameters();
            builder.innerJoin(
                `(${this.getSqlWithParameters(sql, parameters)})`,
                "filteredEntities",
                `filteredEntities.${this.alias}_${this.paginationKeys[0]} = ${this.alias}.${this.paginationKeys[0]}`)
        } else { builder.orderBy(this.buildOrder()); }
        return builder;
    }
    getSqlWithParameters(sql, parameters) {
        var param_index = 0;
        var sql_ = "";
        for (const c of sql) {
            if (c === "?") {
                if (typeof parameters[param_index] === "string")
                    sql_ += `"${parameters[param_index]}"`;
                else
                    sql_ += parameters[param_index];
                param_index++;
            }
            else sql_ += c;
        }
        return sql_;
    }
    buildCursorQuery(where, cursors) {
        const operator = this.getOperator();
        const params = {};
        this.paginationKeys.forEach((key) => {
            params[key] = cursors[key];
            where.andWhere(new typeorm_1.Brackets((qb) => {
                const paramsHolder = {
                    [`${key}_1`]: params[key],
                    [`${key}_2`]: params[key],
                };
                qb.where(`${this.alias}.${key} ${operator} :${key}_1`, paramsHolder);
                if (this.paginationUniqueKey !== key) {
                    qb.orWhere(`${this.alias}.${key} = :${key}_2`, paramsHolder);
                }
            }));
        });
    }
    getOperator() {
        if (this.hasAfterCursor()) {
            return this.order === Order.ASC ? '>' : '<';
        }
        if (this.hasBeforeCursor()) {
            return this.order === Order.ASC ? '<' : '>';
        }
        return '=';
    }
    buildOrder() {
        let { order } = this;
        if (!this.hasAfterCursor() && this.hasBeforeCursor()) {
            order = this.flipOrder(order);
        }
        const orderByCondition = {};
        this.paginationKeys.forEach((key) => {
            orderByCondition[`${this.alias}.${key}`] = order;
        });
        return orderByCondition;
    }
    hasAfterCursor() {
        return this.afterCursor !== null;
    }
    hasBeforeCursor() {
        return this.beforeCursor !== null;
    }
    encode(entity) {
        const payload = this.paginationKeys
            .map((key) => {
                const type = this.getEntityPropertyType(key);
                const value = utils_1.encodeByType(type, entity[key]);
                return `${key}:${value}`;
            })
            .join(',');
        return utils_1.btoa(payload);
    }
    decode(cursor) {
        const cursors = {};
        const columns = utils_1.atob(cursor).split(',');
        columns.forEach((column) => {
            const [key, raw] = column.split(':');
            const type = this.getEntityPropertyType(key);
            const value = utils_1.decodeByType(type, raw);
            cursors[key] = value;
        });
        return cursors;
    }
    getEntityPropertyType(key) {
        return Reflect.getMetadata('design:type', this.entity.prototype, key).name.toLowerCase();
    }
    flipOrder(order) {
        return order === Order.ASC ? Order.DESC : Order.ASC;
    }
    toPagingResult(entities) {
        return {
            data: entities,
            cursor: this.getCursor(),
        };
    }
}
exports.default = Paginator;
