import { DateTime } from 'luxon';

export type Comparator<T> = (a: T, b: T) => number;

export class DataArray<T> {
    private values: T[];

    constructor(values: T[]) {
        this.values = values;
    }

    static from<T>(values: T[]): DataArray<T> {
        return new DataArray(values);
    }

    /**
     * Filter the array
     */
    public where(predicate: (value: T, index: number, array: T[]) => boolean): DataArray<T> {
        return new DataArray(this.values.filter(predicate));
    }

    /**
     * Map the array to a new type
     */
    public map<U>(mapper: (value: T, index: number, array: T[]) => U): DataArray<U> {
        return new DataArray(this.values.map(mapper));
    }

    /**
     * Sort the array
     */
    public sort(keyFn: (value: T) => any, direction: 'asc' | 'desc' = 'asc'): DataArray<T> {
        const sorted = [...this.values].sort((a, b) => {
            const valA = keyFn(a);
            const valB = keyFn(b);

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        return new DataArray(sorted);
    }

    /**
     * Limit the number of results
     */
    public limit(count: number): DataArray<T> {
        return new DataArray(this.values.slice(0, count));
    }

    /**
     * Flatten the array
     */
    public flatten(): DataArray<any> {
        const flattened = this.values.reduce((acc: any[], val: any) => {
            if (Array.isArray(val)) {
                return acc.concat(val);
            } else if (val instanceof DataArray) {
                return acc.concat(val.array());
            } else {
                acc.push(val);
                return acc;
            }
        }, []);
        return new DataArray(flattened);
    }

    /**
     * Group by a key
     * Returns a DataArray of objects { key, rows }
     */
    public groupBy<K>(keyFn: (value: T) => K): DataArray<{ key: K, rows: DataArray<T> }> {
        const groups = new Map<K, T[]>();
        
        for (const item of this.values) {
            const key = keyFn(item);
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(item);
        }

        const result = Array.from(groups.entries()).map(([key, rows]) => ({
            key,
            rows: new DataArray(rows)
        }));

        return new DataArray(result);
    }

    /**
     * Return raw array
     */
    public array(): T[] {
        return this.values;
    }

    /**
     * Length of the array
     */
    public get length(): number {
        return this.values.length;
    }

    // Iterator support
    [Symbol.iterator]() {
        return this.values[Symbol.iterator]();
    }

    // Proxy to allow array-like access (index)
    // Note: This requires the instance to be wrapped in a Proxy, which we can't easily do in the class definition alone
    // without returning a Proxy from the constructor. 
    // For simplicity in this phase, we rely on .array() or explicit methods, 
    // but we can add a specific method to get by index if needed.
    public get(index: number): T | undefined {
        return this.values[index];
    }
    
    // Standard array methods that should return DataArray or primitive
    public forEach(callback: (value: T, index: number, array: T[]) => void): void {
        this.values.forEach(callback);
    }

    public join(separator?: string): string {
        return this.values.join(separator);
    }
}
