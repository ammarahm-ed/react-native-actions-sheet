export declare function getDeviceHeight(statusBarTranslucent: boolean | undefined): number;
export declare const getElevation: (elevation: number) => {
    elevation: number;
    shadowColor: string;
    shadowOffset: {
        width: number;
        height: number;
    };
    shadowOpacity: number;
    shadowRadius: number;
};
export declare const SUPPORTED_ORIENTATIONS: ("portrait" | "portrait-upside-down" | "landscape" | "landscape-left" | "landscape-right")[];
export declare const waitAsync: (ms: number) => Promise<null>;
//# sourceMappingURL=utils.d.ts.map