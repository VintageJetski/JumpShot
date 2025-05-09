declare module 'react-grid-layout' {
  import * as React from 'react';
  
  export interface Layout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
    isDraggable?: boolean;
    isResizable?: boolean;
    static?: boolean;
  }
  
  export interface ResponsiveLayout {
    lg?: Layout[];
    md?: Layout[];
    sm?: Layout[];
    xs?: Layout[];
    xxs?: Layout[];
  }
  
  export interface GridLayoutProps {
    className?: string;
    style?: React.CSSProperties;
    width?: number;
    autoSize?: boolean;
    cols?: number;
    draggableCancel?: string;
    draggableHandle?: string;
    compactType?: 'vertical' | 'horizontal' | null;
    layout?: Layout[];
    margin?: [number, number];
    containerPadding?: [number, number];
    rowHeight?: number;
    maxRows?: number;
    isBounded?: boolean;
    isDraggable?: boolean;
    isResizable?: boolean;
    isDroppable?: boolean;
    preventCollision?: boolean;
    useCSSTransforms?: boolean;
    transformScale?: number;
    resizeHandles?: Array<'s' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne'>;
    resizeHandle?: React.ReactElement | ((resizeHandleAxis: 's' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne') => React.ReactElement);
    verticalCompact?: boolean;
    onLayoutChange?: (layout: Layout[]) => void;
    onDrag?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    onDragStart?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    onDragStop?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    onResize?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    onResizeStart?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    onResizeStop?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    onDrop?: (layout: Layout[], item: Layout, e: Event) => void;
  }
  
  export interface ResponsiveGridLayoutProps extends GridLayoutProps {
    breakpoints?: {lg?: number, md?: number, sm?: number, xs?: number, xxs?: number};
    cols?: {lg?: number, md?: number, sm?: number, xs?: number, xxs?: number};
    layouts?: ResponsiveLayout;
    margin?: {lg?: [number, number], md?: [number, number], sm?: [number, number], xs?: [number, number], xxs?: [number, number]};
    containerPadding?: {lg?: [number, number], md?: [number, number], sm?: [number, number], xs?: [number, number], xxs?: [number, number]};
    onBreakpointChange?: (breakpoint: string, cols: number) => void;
    onLayoutChange?: (layout: Layout[], layouts: ResponsiveLayout) => void;
    onWidthChange?: (containerWidth: number, margin: [number, number], cols: number, containerPadding: [number, number]) => void;
  }
  
  export interface WidthProviderProps {
    measureBeforeMount?: boolean;
  }
  
  export type ReactGridLayoutProps = GridLayoutProps & React.HTMLAttributes<HTMLDivElement>;
  export type ReactResponsiveGridLayoutProps = ResponsiveGridLayoutProps & React.HTMLAttributes<HTMLDivElement>;
  
  export class Responsive extends React.Component<ReactResponsiveGridLayoutProps> {}
  export class GridLayout extends React.Component<ReactGridLayoutProps> {}
  
  export function WidthProvider<P extends {}>(
    ComposedComponent: React.ComponentType<P & { width: number }>
  ): React.ComponentType<P & WidthProviderProps>;
  
  export default GridLayout;
}