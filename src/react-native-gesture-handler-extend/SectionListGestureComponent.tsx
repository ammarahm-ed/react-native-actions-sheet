import * as React from 'react'
import { ForwardedRef, PropsWithChildren, ReactElement, RefAttributes } from 'react'
import { SectionList as RNSectionList, SectionListProps as RNSectionListProps } from 'react-native'
import {
  NativeViewGestureHandlerProps,
  RefreshControl,
  ScrollView
} from 'react-native-gesture-handler'

export const nativeViewGestureHandlerProps = [
  'shouldActivateOnStart',
  'disallowInterruption'
] as const

const commonProps = [
  'id',
  'enabled',
  'shouldCancelWhenOutside',
  'hitSlop',
  'cancelsTouchesInView',
  'userSelect',
  'activeCursor',
  'mouseButton',
  'enableContextMenu',
  'touchAction'
] as const

const componentInteractionProps = ['waitFor', 'simultaneousHandlers', 'blocksHandlers'] as const

export const baseGestureHandlerProps = [
  ...commonProps,
  ...componentInteractionProps,
  'onBegan',
  'onFailed',
  'onCancelled',
  'onActivated',
  'onEnded',
  'onGestureEvent',
  'onHandlerStateChange'
] as const

export const nativeViewProps = [
  ...baseGestureHandlerProps,
  ...nativeViewGestureHandlerProps
] as const

export const SectionList = React.forwardRef((props, ref) => {
  const refreshControlGestureRef = React.useRef<RefreshControl>(null)
  const { waitFor, refreshControl, ...rest } = props
  const sectionListProps = {}
  const scrollViewProps = {}
  for (const [propName, value] of Object.entries(rest)) {
    if ((nativeViewProps as readonly string[]).includes(propName)) {
      // @ts-ignore - this function cannot have generic type so we have to ignore this error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      scrollViewProps[propName] = value
    } else {
      // @ts-ignore - this function cannot have generic type so we have to ignore this error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      sectionListProps[propName] = value
    }
  }

  return (
    // @ts-ignore - this function cannot have generic type so we have to ignore this error
    <RNSectionList
      ref={ref}
      {...sectionListProps}
      renderScrollComponent={(scrollProps) => (
        <ScrollView
          {...{
            ...scrollProps,
            ...scrollViewProps,
            waitFor: [...toArray(waitFor ?? []), refreshControlGestureRef]
          }}
        />
      )}
      // @ts-ignore we don't pass `refreshing` prop as we only want to override the ref
      refreshControl={
        refreshControl
          ? React.cloneElement(refreshControl, {
              // @ts-ignore for reasons unknown to me, `ref` doesn't exist on the type inferred by TS
              ref: refreshControlGestureRef
            })
          : undefined
      }
    />
  )
}) as <ItemT = any>(
  props: PropsWithChildren<
    RNSectionListProps<ItemT> & RefAttributes<SectionList<ItemT>> & NativeViewGestureHandlerProps
  >,
  ref: ForwardedRef<SectionList<ItemT>>
) => ReactElement | null
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type SectionList<ItemT = any> = typeof RNSectionList<ItemT>

export function toArray<T>(object: T | T[]): T[] {
  if (!Array.isArray(object)) {
    return [object]
  }
  return object
}
