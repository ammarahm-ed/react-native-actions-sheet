import {createContext, useCallback, useContext, useState} from 'react';
import {ActionSheetRef} from './../index';
export type Route = {
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

export type Router = {
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

export const useRouter = ({
  onNavigate,
  onNavigateBack,
  initialRoute,
  routes,
  getRef,
}: {
  initialRoute?: string;
  routes?: Route[];
  getRef?: () => ActionSheetRef;
  onNavigate?: (route: string) => void;
  onNavigateBack?: (route: string) => void;
}): Router => {
  const [stack, setStack] = useState<Route[]>([]);
  const currentRoute: Route | undefined = stack?.[stack.length - 1];

  const navigate = useCallback(
    (name: string, params?: any, snap?: number) => {
      getRef?.().snapToRelativeOffset(snap || 20);
      setTimeout(() => {
        setStack(state => {
          const next = routes?.find(route => route.name === name);
          if (!next) {
            return state;
          }
          const currentIndex = state.findIndex(
            route => route.name === next.name,
          );
          if (currentIndex > -1) {
            const nextStack = [...state];
            nextStack.splice(currentIndex, 1);
            return [...nextStack, {...next, params: params || next.params}];
          }
          onNavigate?.(next.name);
          setTimeout(() => {
            getRef?.().snapToRelativeOffset(0);
          }, 1);
          return [...state, next];
        });
      }, 300);
    },
    [getRef, onNavigate, routes],
  );

  const initialNavigation = () => {
    if (!routes) return;
    if (initialRoute) {
      const route = routes?.find(rt => rt.name === initialRoute);
      if (route) {
        setStack([route]);
      }
    } else {
      setStack([routes[0]]);
    }
  };

  const goBack = (name?: string, snap?: number) => {
    getRef?.().snapToRelativeOffset(snap || -10);
    setTimeout(() => {
      setStack(state => {
        const next = routes?.find(route => route.name === name);
        if (state.length === 1) {
          close();
          return state;
        }

        if (!next) {
          const nextStack = [...state];
          nextStack.pop();
          if (currentRoute) {
            getRef?.()?.snapToRelativeOffset(0);
            onNavigateBack?.(nextStack[nextStack.length - 1]?.name);
          }
          return nextStack;
        }
        const currentIndex = stack.findIndex(route => route.name === next.name);
        if (currentIndex > -1) {
          const nextStack = [...state];
          nextStack.splice(currentIndex);
          return [...nextStack, next];
        }
        onNavigateBack?.(next.name);
        return [...stack, next];
      });
    }, 150);
  };

  const close = () => {
    getRef?.()?.hide();
  };

  const popToTop = () => {
    if (!stack[0]) {
      return;
    }
    goBack(stack[0].name);
  };
  return {
    currentRoute: currentRoute as unknown as Route,
    navigate,
    goBack,
    close,
    popToTop,
    hasRoutes: () => routes && routes.length > 0,
    stack,
    initialNavigation,
  };
};

export const RouterContext = createContext<Router | undefined>(undefined);
/**
 * A simple router to navigate between routes in a Sheet.
 */
export const useSheetRouter = () => useContext(RouterContext);

export const RouterParamsContext = createContext<any>(undefined);
/**
 * A hook that returns the params for current navigation route.
 */
export const useSheetRouteParams = () => {
  const context = useContext(RouterParamsContext);
  return context;
};

export type RouteScreenProps<T> = {
  router: Router;
  params: any;
  payload: any;
} & T;
