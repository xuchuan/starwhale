/*
 * Copyright 2022 Starwhale, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package ai.starwhale.mlops.agent.task.inferencetask.action.end;

import ai.starwhale.mlops.agent.container.ContainerClient;
import ai.starwhale.mlops.agent.task.Context;
import ai.starwhale.mlops.agent.task.inferencetask.InferenceTask;
import ai.starwhale.mlops.agent.task.inferencetask.InferenceTaskStatus;
import ai.starwhale.mlops.agent.task.inferencetask.LogRecorder;
import ai.starwhale.mlops.agent.task.inferencetask.action.normal.AbsBasePPLTaskAction;
import cn.hutool.core.bean.BeanUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ArchivedAction extends AbsBasePPLTaskAction {

    @Autowired
    private LogRecorder logRecorder;

    @Override
    public InferenceTask processing(InferenceTask oldTask, Context context)
        throws Exception {
        InferenceTask newTask = BeanUtil.toBean(oldTask, InferenceTask.class);
        newTask.setStatus(InferenceTaskStatus.ARCHIVED);
        return newTask;
    }

    @Override
    public void success(InferenceTask oldTask, InferenceTask newTask, Context context) throws Exception {
        // upload log
        if (StringUtils.isNotEmpty(oldTask.getContainerId())) {
            try {
                ContainerClient.ContainerInfo info = containerClient.containerInfo(oldTask.getContainerId());
                taskPersistence.uploadContainerLog(oldTask, info.getLogPath());
                // remove container
                containerClient.removeContainer(oldTask.getContainerId(), true);
            } catch (Exception e) {
                log.error("occur some error when upload container log:{}", e.getMessage(), e);
            }

        }

        // remove from origin list
        taskPool.failedTasks.remove(oldTask);
        taskPool.succeedTasks.remove(oldTask);
        taskPool.canceledTasks.remove(oldTask);

        logRecorder.remove(oldTask.getId());

    }
}
