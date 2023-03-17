import {createContext, useCallback, useContext, useState} from 'react';
import {Animated} from 'react-native';
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
   * Navigate to a route
   *
   * @param name  Name of the route to navigate to
   * @param params Params to pass to the route upon navigation. These can be accessed in the route using `useSheetRouteParams` hook.
   * @param snap Snap value for navigation animation. Between -100 to 100. A positive value snaps inwards, while a negative value snaps outwards.
   */
  navigate: (name: string, params?: any, snap?: number) => void;
  /**
   * Navigate back from a route.
   *
   * @param name  Name of the route to navigate back to.
   * @param snap Snap value for navigation animation. Between -100 to 100. A positive value snaps inwards, while a negative value snaps outwards.
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
   * An internal function called by sheet to navigate to initial route.
   */
  initialNavigation: () => void;
  canGoBack: () => boolean;
};

export const useRouter = ({
  onNavigate,
  onNavigateBack,
  initialRoute,
  routes,
  getRef,
  routeOpacity,
}: {
  initialRoute?: string;
  routes?: Route[];
  getRef?: () => ActionSheetRef;
  onNavigate?: (route: string) => void;
  onNavigateBack?: (route: string) => void;
  routeOpacity: Animated.Value;
}): Router => {
  const [stack, setStack] = useState<Route[]>([]);
  const currentRoute: Route | undefined = stack?.[stack.length - 1];

  const animate = useCallback(
    (snap = 0, opacity = 0, delay = 0) => {
      getRef?.().snapToRelativeOffset(snap);
      Animated.timing(routeOpacity, {
        toValue: opacity,
        duration: 150,
        useNativeDriver: true,
        delay: delay,
      }).start();
    },
    [getRef, routeOpacity],
  );

  const navigate = useCallback(
    (name: string, params?: any, snap: number = 20) => {
      animate(snap, 0);
      setTimeout(() => {
        setStack(state => {
          const next = routes?.find(route => route.name === name);
          if (!next) {
            animate(0, 1);
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
          animate(0, 1, 150);
          return [...state, {...next, params: params || next.params}];
        });
      }, 100);
    },
    [animate, routes, onNavigate],
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
    Animated.timing(routeOpacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const goBack = (name?: string, snap: number = -10) => {
    getRef?.().snapToRelativeOffset(snap);
    animate(snap, 0);
    setTimeout(() => {
      setStack(state => {
        const next = routes?.find(route => route.name === name);
        if (state.length === 1) {
          close();
          animate(0, 1);
          return state;
        }

        if (!next) {
          const nextStack = [...state];
          nextStack.pop();
          if (currentRoute) {
            onNavigateBack?.(nextStack[nextStack.length - 1]?.name);
            animate(0, 1, 150);
          }
          return nextStack;
        }
        const currentIndex = stack.findIndex(route => route.name === next.name);
        if (currentIndex > -1) {
          const nextStack = [...state];
          nextStack.splice(currentIndex);
          onNavigateBack?.(nextStack[nextStack.length - 1]?.name);
          animate(0, 1, 150);
          return [...nextStack, next];
        }
        animate(0, 1, 150);
        onNavigateBack?.(next.name);
        return [...stack, next];
      });
    }, 100);
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

  const canGoBack = () => {
    return stack && stack.length > 1;
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
    canGoBack,
  };
};

export const RouterContext = createContext<Router | undefined>(undefined);
/**
 * A hook that you can use to control the router.
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

export type RouteScreenProps<T = {}> = {
  router: Router;
  params: any;
  payload: any;
} & T;
