/// <reference types="react" />
import { ActionSheetRef } from './../index';
export declare type Route = {
    /**
     * Name of the route.
     */
    name: string;
    /**
     * A react component that will render when this route is navigated to.
     */
    component: any;
    /**
     * Initial params for the route.
     */
    params?: any;
};
export declare type Router = {
    currentRoute: Route;
    /**
     * @param name  Name of the route to navigate to
     * @param params Params to pass to the route upon navigation
     * @param snap Snap value for navigation animation. Between -100 - 100. A positive value snaps inwards, while a negative value snaps outwards.
     */
    navigate: (name: string, params?: any, snap?: number) => void;
    /**
     * @param name  Name of the route to navigate back to.
     * @param snap Snap value for navigation animation. Between -100 - 100. A positive value snaps inwards, while a negative value snaps outwards.
     */
    goBack: (name?: string, snap?: number) => void;
    /**
     * Close the action sheet.
     */
    close: () => void;
    /**
     * Pop to top of the stack.
     */
    popToTop: () => void;
    /**
     * Whether this router has any routes registered.
     */
    hasRoutes: () => boolean | undefined;
    /**
     * Get the currently rendered stack.
     */
    stack: Route[];
    /**
     * An internal function called by sheet to navigation to initial route.
     */
    initialNavigation: () => void;
};
export declare const useRouter: ({ onNavigate, onNavigateBack, initialRoute, routes, getRef, }: {
    initialRoute?: string | undefined;
    routes?: Route[] | undefined;
    getRef?: (() => ActionSheetRef) | undefined;
    onNavigate?: ((route: string) => void) | undefined;
    onNavigateBack?: ((route: string) => void) | undefined;
}) => Router;
export declare const RouterContext: import("react").Context<Router | undefined>;
/**
 * A simple router to navigate between routes in a Sheet.
 */
export declare const useSheetRouter: () => Router | undefined;
export declare const RouterParamsContext: import("react").Context<any>;
/**
 * A hook that returns the params for current navigation route.
 */
export declare const useSheetRouteParams: () => any;
export declare type RouteScreenProps<T> = {
    router: Router;
    params: any;
    payload: any;
} & T;
//# sourceMappingURL=use-router.d.ts.map