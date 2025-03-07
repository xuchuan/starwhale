import React from 'react'
import { useStore } from './useStore'
import { ConfigQuery, ConfigQueryInline, ExtraPropsT } from '../components/Query'
import shallow from 'zustand/shallow'
import { IGridState } from '../types'
import useGirdData from './useGridData'
import ConfigSimpleQuery from '../components/Query/ConfigSimpleQuery'
import Button from '@starwhale/ui/Button'
import useTranslation from '@/hooks/useTranslation'
import { useTrace } from '@starwhale/core'

const non: any = []
const selector = (state: IGridState) => ({
    queries: state.currentView?.queries || non,
    onCurrentViewQueriesChange: state.onCurrentViewQueriesChange,
})

function useGridQuery() {
    const trace = useTrace('grid-table-user-grid-query')
    const { queries, onCurrentViewQueriesChange: onChange } = useStore(selector, shallow)
    const { originalColumns } = useGirdData()
    const [isSimpleQuery, setIsSimpleQuery] = React.useState(true)
    const [t] = useTranslation()

    const hasFilter = React.useMemo(() => {
        return originalColumns?.find((column) => column.filterable)
    }, [originalColumns])

    const renderConfigQuery = React.useCallback(() => {
        trace({ queries })

        return (
            <>
                <div className='flex justify-between items-center gap-20px'>
                    <div className='flex flex-1'>
                        {isSimpleQuery ? (
                            <ConfigSimpleQuery columns={originalColumns} value={queries} onChange={onChange} />
                        ) : (
                            <ConfigQuery value={queries} onChange={onChange} columns={originalColumns} />
                        )}
                    </div>
                    {hasFilter && (
                        <Button as='link' onClick={() => setIsSimpleQuery(!isSimpleQuery)}>
                            {!isSimpleQuery ? t('table.config.query.simple') : t('table.config.query.advanced')}
                        </Button>
                    )}
                </div>
            </>
        )
    }, [trace, originalColumns, queries, onChange, isSimpleQuery, hasFilter, t])

    const renderConfigQueryInline = React.useCallback(
        (props: ExtraPropsT) => {
            return <ConfigQueryInline {...props} value={queries} onChange={onChange} columns={originalColumns} />
        },
        [originalColumns, queries, onChange]
    )

    return {
        renderConfigQuery,
        renderConfigQueryInline,
        value: queries,
        onChange,
    }
}

export { useGridQuery }
export default useGridQuery
