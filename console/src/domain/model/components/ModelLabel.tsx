import Alias from '@/components/Alias'
import { formatTimestampDateTime } from '@/utils/datetime'
import { themedStyled } from '@starwhale/ui/theme/styletron'
import React from 'react'
import Shared from '@/components/Shared'
import { getAliasStr } from '@base/utils/alias'
import { IModelVersionViewVo, IModelVersionVo, IModelViewVo } from '@/api'
import { IHasTagSchema } from '@base/schemas/resource'

export const ModelLabelContainer = themedStyled('div', () => ({
    display: 'inline-flex',
    gap: '4px',
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    minWidth: 0,
    overflow: 'hidden',
}))

export const ModelLabelText = themedStyled('div', () => ({
    display: 'inline-flex',
    minWidth: '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontFamily: 'Roboto Mono',
    height: 'inherit',
    flexShrink: 0,
}))

export function getModelLabel(version: IModelVersionViewVo, model?: IModelViewVo) {
    const p = model ? [model.ownerName, model.projectName, model.modelName].join('/') : ''
    const name = version.versionName
    const v = (name ?? '').substring(0, 8)
    const title = [p, v, version?.alias, version.createdTime ? formatTimestampDateTime(version.createdTime) : '']
        .filter((tmp) => !!tmp)
        .join('/')

    return title
}

export function ModelLabel({
    version,
    model,
    isProjectShow = false,
    style = {},
}: {
    version: IModelVersionVo | IModelVersionViewVo
    model?: IModelViewVo
    isProjectShow?: boolean
    style?: React.CSSProperties
}) {
    const share = <Shared shared={!!version.shared} isTextShow={false} />
    const alias = <Alias alias={getAliasStr(version as IHasTagSchema)} />
    const p = model ? [model.ownerName, model.projectName, model.modelName].join('/') : ''
    const name = (version as IModelVersionViewVo)?.versionName ?? (version as IModelVersionVo)?.name
    const v = (name ?? '').substring(0, 8)
    const title = [p, v, version.createdTime ? formatTimestampDateTime(version.createdTime) : '']
        .filter((tmp) => !!tmp)
        .join('/')

    return (
        <ModelLabelContainer style={style} title={title}>
            {share} <ModelLabelText>{isProjectShow ? [p, v].join('/') : v}</ModelLabelText> {alias}
        </ModelLabelContainer>
    )
}

export default ModelLabel
