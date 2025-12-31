/* eslint-disable curly */
import React, { RefObject, useImperativeHandle } from 'react'
import { Platform, SectionList as RNSectionList, SectionListProps } from 'react-native'
import { NativeViewGestureHandlerProps } from 'react-native-gesture-handler'
import { SectionList as RNGHSectionList } from '../react-native-gesture-handler-extend/SectionListGestureComponent'
import { useScrollHandlers } from '../hooks/use-scroll-handlers'

type Props<T = any> = SectionListProps<T> &
  Partial<NativeViewGestureHandlerProps> &
  React.RefAttributes<RNSectionList> & {
    /**
     * By default refresh control gesture will work in top 15% area of the ScrollView. You can set a different value here.
     *
     * Accepts a value between 0-1.
     */
    refreshControlGestureArea?: number
  }

function $SectionList<T>(props: Props<T>, ref: React.ForwardedRef<RefObject<RNSectionList>>) {
  const handlers = useScrollHandlers<RNSectionList>({
    hasRefreshControl: !!props.refreshControl,
    refreshControlBoundary: props.refreshControlGestureArea || 0.15
  })
  useImperativeHandle(ref, () => handlers.ref)
  const ScrollComponent = Platform.OS === 'web' ? RNSectionList : RNGHSectionList

  return (
    //@ts-ignore
    <ScrollComponent
      {...props}
      {...handlers}
      //@ts-ignore
      onScroll={(event) => {
        handlers.onScroll(event)
        props.onScroll?.(event)
      }}
      bounces={false}
      //@ts-ignore
      onLayout={(event) => {
        handlers.onLayout()
        props.onLayout?.(event)
      }}
      scrollEventThrottle={1}
    />
  )
}

export const SectionList = React.forwardRef($SectionList) as unknown as typeof RNSectionList
