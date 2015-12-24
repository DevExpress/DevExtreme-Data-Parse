declare module DevExpress.data {
    export interface ParseStoreOptions extends StoreOptions {
        className?: string;
        normalizeResponse?: boolean;
    }

    export class ParseStore extends DevExpress.data.Store {
        constructor(options?: ParseStoreOptions);

        className(): string;
        normalizationEnabled(): boolean;
    }
}