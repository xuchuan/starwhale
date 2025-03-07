import React, { useState } from 'react'
import _ from 'lodash'
import { ErrorBoundary } from '@starwhale/ui/ErrorBoundary'
import { WidgetRendererProps } from '../types'
import { useWidget } from './WidgetFactory'

const DEBUG = false
const empty = {}
const emptyfn = () => {}
export function WidgetRenderer<P extends object = any, F extends object = any>(props: WidgetRendererProps<P, F>) {
    const {
        id,
        type,
        path,
        data,
        optionConfig = empty,
        onOptionChange = emptyfn,
        fieldConfig = empty,
        onFieldChange = emptyfn,
        onLayoutOrderChange = emptyfn,
        onLayoutChildrenChange = emptyfn,
        onLayoutCurrentChange = emptyfn,
        children,
        eventBus,
        ...rest
    } = props

    const { widget } = useWidget(type)
    const [error] = useState<string | undefined>()
    const optionsWithDefaults = React.useMemo(
        () => _.merge({}, widget?.defaults?.optionConfig ?? empty, optionConfig),
        [widget?.defaults, optionConfig]
    )
    const fieldsWithDefaults = React.useMemo(
        () => _.merge({}, widget?.defaults?.fieldConfig ?? empty, fieldConfig),
        [widget?.defaults, fieldConfig]
    )

    if (error) {
        return <div>Failed to load widget: {error}</div>
    }

    if (!widget) {
        return <div>Loading widget {type}...</div>
    }

    if (!widget.renderer) {
        return <div>Seems like the widget you are trying to load does not have a renderer component.</div>
    }
    const WidgetComponent = widget.renderer

    // if (!data) {
    //     return <div>No datastore data</div>
    // }

    // console.log('WidgetComponent', optionsWithDefaults)

    return (
        <ErrorBoundary>
            {DEBUG && `${type}-${id}`}
            <WidgetComponent
                id={id ?? '0'}
                path={path}
                type={type}
                data={data}
                // title={title}
                // transparent={false}
                // width={width}
                // height={height}
                // renderCounter={0}
                // replaceVariables={(str: string) => str}
                // @ts-ignore
                defaults={widget.defaults ?? empty}
                optionConfig={optionsWithDefaults}
                onOptionChange={onOptionChange}
                //
                fieldConfig={fieldsWithDefaults}
                // @ts-ignore
                onFieldChange={onFieldChange}
                //
                onLayoutOrderChange={onLayoutOrderChange}
                onLayoutChildrenChange={onLayoutChildrenChange}
                onLayoutCurrentChange={onLayoutCurrentChange}
                eventBus={eventBus}
                {...rest}
            >
                {children}
            </WidgetComponent>
        </ErrorBoundary>
    )
}

// export let PanelRenderer: WidgetRendererType = () => {
//     return <div>WidgetRenderer can only be used instance has been started.</div>
// }

// /**
//  * Used to bootstrap the PanelRenderer during application start so the PanelRenderer
//  * is exposed via runtime.
//  *
//  * @internal
//  */
// export function setPanelRenderer(renderer: WidgetRendererType) {
//     PanelRenderer = renderer
// }

export default WidgetRenderer
