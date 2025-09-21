export declare class AsyncWorker {
    private history;
    compute(input: number): Promise<number>;
    entries(limit?: number): AsyncGenerator<string, void, void>;
    queueTask: (label: string) => Promise<string>;
    static ready(): Promise<AsyncWorker>;
}
export declare function createAsyncWorker(): Promise<AsyncWorker>;
