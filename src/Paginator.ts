import { ObjectType, SelectQueryBuilder } from 'typeorm';
export declare enum Order {
    ASC = "ASC",
    DESC = "DESC"
}
export declare type EscapeFn = (name: string) => string;
export interface CursorParam {
    [key: string]: any;
}
export interface Cursor {
    beforeCursor: string | null;
    afterCursor: string | null;
}
export interface PagingResult<Entity> {
    data: Entity[];
    cursor: Cursor;
}
export default class Paginator<Entity> {
    private entity;
    private paginationKeys;
    private paginationUniqueKey;
    private afterCursor;
    private beforeCursor;
    private nextAfterCursor;
    private nextBeforeCursor;
    private alias;
    private limit;
    private order;
    constructor(entity: ObjectType<Entity>, paginationKeys: Extract<keyof Entity, string>[], paginationUniqueKey: Extract<keyof Entity, string>);
    setAlias(alias: string): void;
    setAfterCursor(cursor: string): void;
    setBeforeCursor(cursor: string): void;
    setLimit(limit: number): void;
    setOrder(order: Order): void;
    paginate(builder: SelectQueryBuilder<Entity>, limitBuilder?: SelectQueryBuilder<Entity>): Promise<PagingResult<Entity>>;
    private getCursor;
    private appendPagingQuery;
    private buildCursorQuery;
    private getOperator;
    private buildOrder;
    private hasAfterCursor;
    private hasBeforeCursor;
    private encode;
    private decode;
    private getEntityPropertyType;
    private flipOrder;
    private toPagingResult;
}
