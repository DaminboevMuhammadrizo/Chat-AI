declare module "better-sqlite3" {
  interface DatabaseOptions {
    readonly memory?: boolean;
    readonly fileMustExist?: boolean;
    readonly verbose?: (...args: any[]) => void;
  }

  interface RunResult {
    changes: number;
    lastInsertRowid: number;
  }

  interface Statement {
    run(...params: any[]): RunResult;
    get(...params: any[]): any;
    all(...params: any[]): any[];
    iterate(...params: any[]): IterableIterator<any>;
    bind(...params: any[]): Statement;
  }

  class Database {
    constructor(filename: string, options?: DatabaseOptions);
    prepare(sql: string): Statement;
    exec(sql: string): void;
    close(): void;
  }

  const database: typeof Database;
  export default database;
}
