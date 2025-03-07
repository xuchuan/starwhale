import React, { useCallback, useDeferredValue, useEffect, useReducer } from 'react'
import { VariableSizeGrid } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import { SORT_DIRECTIONS } from './constants'
import MeasureColumnWidths from './measure-column-widths'
import { LocaleContext } from 'baseui/locale'
import { themedUseStyletron } from '../../theme/styletron'
import { HeaderContext, HEADER_ROW_HEIGHT } from './headers/header'
import Headers from './headers/headers'
import InnerTableElement from './inner-table-element'
import CellPlacementMemo from './cells/cell-placement'
import { DataTablePropsT } from './types'
import { useEvent, useEventCallback } from '@starwhale/core'
import _ from 'lodash'
import { IGridState } from '@starwhale/ui/GridTable/types'
import { useStore } from '@starwhale/ui/GridTable/hooks/useStore'
import shallow from 'zustand/shallow'

const STYLE = { overflow: 'auto' }
const sum = (ns: number[]): number => ns.reduce((s, n) => s + n, 0)
function MeasureScrollbarWidth(props: { onWidthChange: (width: number) => void }) {
    const [css] = themedUseStyletron()
    const outerRef = React.useRef<HTMLDivElement>(null)
    const innerRef = React.useRef<HTMLDivElement>(null)
    React.useEffect(() => {
        if (outerRef.current && innerRef.current) {
            const width = outerRef.current.offsetWidth - innerRef.current.offsetWidth
            props.onWidthChange(width)
        }
    }, [props])
    return (
        <div
            data-type='table-measure-scrollbar'
            className={css({
                height: 0,
                visibility: 'hidden',
                overflow: 'scroll',
            })}
            ref={outerRef}
        >
            <div ref={innerRef} />
        </div>
    )
}

const selector = (s: IGridState) => ({
    measuredWidths: new Map(Object.entries(s.getMeasuredWidths() || {})),
    setMeasuredWidths: s.setMeasuredWidths,
    resizeDeltas: new Map(Object.entries(s.getResizeDeltas() || {})),
    onColumnResize: s.onColumnResize,
})

export function DataTable({
    selectable = false,
    columns,
    rawColumns,
    filters,
    emptyMessage,
    loading,
    loadingMessage,
    onIncludedRowsChange,
    onRowHighlightChange,
    isRowSelected,
    isSelectedAll,
    isSelectedIndeterminate,
    onSelectMany,
    onSelectNone,
    onSelectOne,
    onSort,
    resizableColumnWidths = false,
    compareable = false,
    queryinline = false,
    previewable = false,
    removable = false,
    rows: allRows,
    rowHeight = 44,
    rowHighlightIndex: rowHighlightIndexControlled,
    sortIndex,
    sortDirection,
    textQuery = '',
    getId,
    controlRef,
    onPreview,
    onRemove,
    rowActions,
}: DataTablePropsT) {
    const [, theme] = themedUseStyletron()
    const locale = React.useContext(LocaleContext)

    const rowHeightAtIndex = React.useCallback(
        (index: number) => {
            return rowHeight
        },
        [rowHeight]
    )

    const { measuredWidths, setMeasuredWidths, resizeDeltas, onColumnResize } = useStore(selector, shallow)

    // We use state for our ref, to allow hooks to  update when the ref changes.
    const [gridRef, setGridRef] = React.useState<VariableSizeGrid<any> | null>(null)

    const [itemIndexs, setItemIndexs] = React.useState({
        overscanColumnStartIndex: 0,
        overscanColumnStopIndex: 0,
        overscanRowStartIndex: 0,
        overscanRowStopIndex: 0,
        visibleColumnStartIndex: 0,
        visibleColumnStopIndex: 0,
        visibleRowStartIndex: 0,
        visibleRowStopIndex: 0,
    })

    const handleItemsRendered = useEventCallback(
        ({
            overscanColumnStartIndex,
            overscanColumnStopIndex,
            overscanRowStartIndex,
            overscanRowStopIndex,
            visibleColumnStartIndex,
            visibleColumnStopIndex,
            visibleRowStartIndex,
            visibleRowStopIndex,
        }) => {
            startTransition(() => {
                setItemIndexs({
                    overscanColumnStartIndex,
                    overscanColumnStopIndex,
                    overscanRowStartIndex,
                    overscanRowStopIndex,
                    visibleColumnStartIndex,
                    visibleColumnStopIndex,
                    visibleRowStartIndex,
                    visibleRowStopIndex,
                })
            })
        }
    )

    const columnKeys = React.useMemo(() => columns.map((c) => c.key).join(','), [columns])

    useEffect(() => {
        if (gridRef) {
            // console.log('reset grid when columns change reorder', columnKeys)
            gridRef.resetAfterIndices({
                columnIndex: 0,
                rowIndex: 0,
                shouldForceUpdate: true,
            })
        }
    }, [gridRef, columnKeys])

    const [_scrollLeft, setScrollLeft] = React.useState(0)
    const scrollLeft = useDeferredValue(_scrollLeft)

    const resetAfterColumnIndex = useEventCallback(
        _.debounce((columnIndex) => {
            if (gridRef) {
                gridRef.resetAfterColumnIndex?.(columnIndex, true)
            }
        }, 10)
    )

    const handleWidthsChange = useEventCallback((nextWidths) => {
        setMeasuredWidths(Object.fromEntries(nextWidths))
        resetAfterColumnIndex(itemIndexs.overscanColumnStartIndex)
    })

    const handleColumnResize = useEventCallback((columnIndex, delta) => {
        const column = columns[columnIndex]
        onColumnResize(column.key, delta)
        resetAfterColumnIndex(columnIndex)
    })
    const [isScrollingX, setIsScrollingX] = React.useState(false)
    const [recentlyScrolledX, setRecentlyScrolledX] = React.useState(false)
    const [, startTransition] = React.useTransition()
    React.useLayoutEffect(() => {
        if (recentlyScrolledX !== isScrollingX) {
            setIsScrollingX(recentlyScrolledX)
        }

        if (recentlyScrolledX) {
            const timeout = setTimeout(() => {
                setRecentlyScrolledX(false)
            }, 200)
            return () => clearTimeout(timeout)
        }
        return () => {}
    }, [recentlyScrolledX, isScrollingX])

    const handleScroll = useEventCallback((params) => {
        const eventScrollLeft = params.scrollLeft

        startTransition(() => {
            setScrollLeft(eventScrollLeft)
            if (eventScrollLeft !== scrollLeft) {
                setRecentlyScrolledX(true)
            }
        })
    })

    const sortedIndices = React.useMemo(() => {
        const toSort = allRows.map((r, i) => [r, i])
        const index = sortIndex

        if (index !== null && index !== undefined && index !== -1 && columns[index]) {
            const { sortFn } = columns[index]
            // @ts-ignore
            const getValue = (row) =>
                columns[index].mapDataToValue?.(row.data).value || columns[index].mapDataToValue?.(row.data)

            if (sortDirection === SORT_DIRECTIONS.ASC) {
                toSort.sort((a, b) => {
                    return sortFn(getValue(a[0]), getValue(b[0]))
                })
            } else if (sortDirection === SORT_DIRECTIONS.DESC) {
                toSort.sort((a, b) => sortFn(getValue(b[0]), getValue(a[0])))
            }
        }

        return toSort.map((el) => el[1])
    }, [sortIndex, sortDirection, columns, allRows])

    // only
    const filteredIndices = React.useMemo(() => {
        const set = new Set(allRows.map((_, idx) => idx))

        Array.from(filters || new Set(), (f) => f)
            .filter((v: any) => !v.disable)
            .forEach((filter: any) => {
                const columnIndex = rawColumns?.findIndex((c) => c.key === filter.key) ?? -1
                const column = rawColumns?.[columnIndex]

                if (!column) {
                    return
                }

                const filterFn = filter?.op.buildFilter(filter) // ?? column.buildFilter(filter)
                Array.from(set).forEach((idx) => {
                    if (!filterFn(column.mapDataToValue?.(allRows[idx].data), allRows[idx].data, column)) {
                        set.delete(idx)
                    }
                })
            })

        if (textQuery) {
            const stringishColumnIndices: number[] = []
            for (let i = 0; i < columns.length; i++) {
                if (columns[i].textQueryFilter) {
                    stringishColumnIndices.push(i)
                }
            }
            Array.from(set).forEach((idx) => {
                // @ts-ignore
                const matches = stringishColumnIndices.some((cdx) => {
                    const column = columns[cdx]
                    const { textQueryFilter } = column
                    if (textQueryFilter) {
                        return textQueryFilter(textQuery, column.mapDataToValue?.(allRows[idx].data))
                    }
                    return false
                })

                if (!matches) {
                    set.delete(idx)
                }
            })
        }

        return set
    }, [filters, textQuery, rawColumns, allRows, columns])

    const rows = React.useMemo(() => {
        // @ts-ignore
        const result = sortedIndices.filter((idx) => filteredIndices.has(idx)).map((idx) => allRows[idx])

        if (onIncludedRowsChange) {
            onIncludedRowsChange(result)
        }
        return result
    }, [sortedIndices, filteredIndices, onIncludedRowsChange, allRows])

    React.useImperativeHandle(controlRef, () => ({ getRows: () => rows }), [rows])

    const [browserScrollbarWidth, setBrowserScrollbarWidth] = React.useState(0)
    const [gridWidth, setGridWidth] = React.useState(0)

    const normalizedWidths = React.useMemo(() => {
        const resizedWidths = columns.map((c, i) => {
            const w =
                !measuredWidths.get(c.key) || _.isNaN(measuredWidths.get(c.key))
                    ? c.minWidth
                    : measuredWidths.get(c.key)
            const delta = !resizeDeltas.get(c.key) || _.isNaN(resizeDeltas.get(c.key)) ? 0 : resizeDeltas.get(c.key)
            return w + delta
        })

        if (gridRef) {
            const gridProps = gridRef.props

            let isContentTallerThanContainer = false
            let visibleRowHeight = 0
            for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                visibleRowHeight += rowHeightAtIndex(rowIndex)
                if (visibleRowHeight >= gridProps.height) {
                    isContentTallerThanContainer = true
                    break
                }
            }

            const scrollbarWidth = isContentTallerThanContainer ? browserScrollbarWidth : 0

            const remainder = Math.max(gridWidth - sum(resizedWidths) - scrollbarWidth, 0)
            const filledColumnsLen = columns.filter((c) => c.fillWidth).length
            const padding = filledColumnsLen === 0 ? 0 : Math.floor(remainder / filledColumnsLen)

            if (padding > 0) {
                const result: number[] = []
                // -1 so that we loop over all but the last item
                for (let i = 0; i < resizedWidths.length - 1; i++) {
                    if (columns[i] && columns[i].fillWidth) {
                        result.push(resizedWidths[i] + padding)
                    } else {
                        result.push(resizedWidths[i])
                    }
                }
                result.push(gridWidth - sum(result) - scrollbarWidth - 2)

                return result.reduce((acc, width, i) => {
                    acc.set(columns[i].key, width)
                    return acc
                }, new Map())
            }
        }

        resetAfterColumnIndex(0)
        // turn to map
        return resizedWidths.reduce((acc, width, i) => {
            acc.set(columns[i].key, width)
            return acc
        }, new Map())
    }, [
        resetAfterColumnIndex,
        gridRef,
        gridWidth,
        measuredWidths,
        resizeDeltas,
        browserScrollbarWidth,
        rows.length,
        columns,
        rowHeightAtIndex,
    ])

    const isSelectable = selectable
    const isQueryInline = queryinline
    const handleSort = React.useCallback(
        (columnIndex) => {
            if (onSort) {
                onSort(columnIndex)
            }
        },
        [onSort]
    )

    const [columnHighlightIndex, setColumnHighlightIndex] = React.useState(-1)
    const [rowHighlightIndex, setRowHighlightIndex] = React.useState(-1)

    // @ts-ignore
    const handleRowHighlightIndexChange = useEvent((nextIndex) => {
        setRowHighlightIndex(nextIndex)
        if (gridRef) {
            if (nextIndex >= 0) {
                // $FlowFixMe - unable to get react-window types
                // gridRef.scrollToItem({ rowIndex: nextIndex })
            }
            onRowHighlightChange?.(nextIndex, rows[nextIndex])
        }
    })

    const handleRowMouseEnter = useEvent((nextIndex) => {
        handleRowHighlightIndexChange(nextIndex)
    })

    const handleRowMouseLeave = useEvent(() => {
        handleRowHighlightIndexChange(-1)
    })

    const handleColumnHeaderMouseEnter = useEvent((columnIndex) => {
        setColumnHighlightIndex(columnIndex)
        handleRowHighlightIndexChange(-1)
    })

    const handleColumnHeaderMouseLeave = useEvent(() => {
        setColumnHighlightIndex(-1)
    })

    React.useEffect(() => {
        if (typeof rowHighlightIndexControlled === 'number') {
            handleRowHighlightIndexChange(rowHighlightIndexControlled)
        }
    }, [rowHighlightIndexControlled, handleRowHighlightIndexChange])

    const itemData = React.useMemo(() => {
        return {
            // columnHighlightIndex,
            // warning: this can cause performance problem, and inline edit will have wrong behaviour so use row own behaviour
            // rowHighlightIndex,
            isRowSelected,
            isQueryInline,
            isSelectable,
            previewable,
            removable,
            onRowMouseEnter: handleRowMouseEnter,
            onSelectOne,
            columns,
            rows,
            textQuery,
            normalizedWidths,
            getId,
            onPreview,
            onRemove,
        }
    }, [
        handleRowMouseEnter,
        isRowSelected,
        isSelectable,
        isQueryInline,
        previewable,
        removable,
        rows,
        columns,
        onSelectOne,
        textQuery,
        normalizedWidths,
        getId,
        onPreview,
        onRemove,
    ])

    const InnerElement = React.useMemo(() => {
        // @ts-ignore
        return (props) => <InnerTableElement {...props} data={itemData} gridRef={gridRef} />
    }, [itemData, gridRef])

    // useIfChanged({
    //     normalizedWidths,
    //     columnWidth,
    //     gridWidth,
    // })

    const $columnsShowed = React.useMemo(() => {
        return columns.filter(
            (c, i) => i >= itemIndexs.overscanColumnStartIndex && i <= itemIndexs.overscanColumnStopIndex
        )
    }, [columns, itemIndexs])

    const columnCount = columns.length

    const columnWidth = React.useCallback(
        (index) => {
            return normalizedWidths.get(columns[index]?.key)
        },
        [normalizedWidths, columns]
    )

    return (
        <>
            <MeasureColumnWidths
                columns={$columnsShowed}
                rows={rows}
                measuredWidths={measuredWidths}
                isSelectable={isSelectable}
                isQueryInline={isQueryInline}
                onWidthsChange={handleWidthsChange}
            />
            <MeasureScrollbarWidth onWidthChange={(w) => setBrowserScrollbarWidth(w)} />
            {/* don't assign with to auto sizer */}
            <AutoSizer
                className='table-auto-resizer'
                onResize={(args) => {
                    setGridWidth(args.width)
                }}
            >
                {({ height, width }) => {
                    const scrollbarWidth = () => {
                        if (!gridRef) return 0
                        const gridProps = gridRef.props

                        let isContentTallerThanContainer = false
                        let visibleRowHeight = 0
                        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                            visibleRowHeight += rowHeightAtIndex(rowIndex)
                            if (visibleRowHeight >= gridProps.height) {
                                isContentTallerThanContainer = true
                                break
                            }
                        }

                        return isContentTallerThanContainer ? browserScrollbarWidth : 0
                    }

                    return (
                        <>
                            <HeaderContext.Provider
                                value={{
                                    columns,
                                    columnHighlightIndex,
                                    // @ts-ignore
                                    emptyMessage: emptyMessage || locale.datatable.emptyState,
                                    filters,
                                    loading: Boolean(loading),
                                    // @ts-ignore
                                    loadingMessage: loadingMessage || locale.datatable.loadingState,
                                    isScrollingX,
                                    isSelectable,
                                    isSelectedAll,
                                    isSelectedIndeterminate,
                                    isQueryInline,
                                    onMouseEnter: handleColumnHeaderMouseEnter,
                                    onMouseLeave: handleColumnHeaderMouseLeave,
                                    onRowMouseLeave: handleRowMouseLeave,
                                    onResize: handleColumnResize,
                                    onSelectMany,
                                    onSelectNone,
                                    onSort: handleSort,
                                    resizableColumnWidths,
                                    compareable,
                                    removable,
                                    rowHeight,
                                    rowHighlightIndex,
                                    rows,
                                    scrollLeft,
                                    sortDirection: sortDirection || null,
                                    sortIndex: typeof sortIndex === 'number' ? sortIndex : -1,
                                    tableHeight: height,
                                    widths: normalizedWidths,
                                    onSelectOne,
                                    getId,
                                    width,
                                    scrollbarWidth: scrollbarWidth(),
                                    rowActions,
                                }}
                            >
                                {/*  headers outside to make scroll not covered header bar */}
                                <Headers width={width} />

                                <VariableSizeGrid
                                    className='table-columns'
                                    ref={setGridRef as any}
                                    overscanRowCount={0}
                                    overscanColumnCount={0}
                                    innerElementType={InnerElement}
                                    height={height - HEADER_ROW_HEIGHT}
                                    columnWidth={columnWidth}
                                    columnCount={columnCount}
                                    width={width}
                                    itemData={itemData}
                                    onScroll={handleScroll}
                                    rowCount={rows.length}
                                    rowHeight={rowHeightAtIndex}
                                    style={STYLE}
                                    direction={theme.direction === 'rtl' ? 'rtl' : 'ltr'}
                                    onItemsRendered={handleItemsRendered}
                                >
                                    {CellPlacementMemo as any}
                                </VariableSizeGrid>
                            </HeaderContext.Provider>
                        </>
                    )
                }}
            </AutoSizer>
        </>
    )
}
