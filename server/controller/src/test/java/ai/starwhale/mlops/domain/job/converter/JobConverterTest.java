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

package ai.starwhale.mlops.domain.job.converter;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.hasProperty;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.isA;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.mock;
import static org.mockito.Mockito.when;

import ai.starwhale.mlops.api.protocol.job.JobVo;
import ai.starwhale.mlops.api.protocol.runtime.RuntimeVo;
import ai.starwhale.mlops.api.protocol.user.UserVo;
import ai.starwhale.mlops.common.IdConvertor;
import ai.starwhale.mlops.domain.dataset.po.DatasetVersionEntity;
import ai.starwhale.mlops.domain.job.mapper.JobDatasetVersionMapper;
import ai.starwhale.mlops.domain.job.po.JobEntity;
import ai.starwhale.mlops.domain.job.status.JobStatus;
import ai.starwhale.mlops.domain.model.po.ModelVersionEntity;
import ai.starwhale.mlops.domain.runtime.RuntimeService;
import ai.starwhale.mlops.domain.system.SystemSettingService;
import ai.starwhale.mlops.domain.system.resourcepool.bo.ResourcePool;
import ai.starwhale.mlops.domain.user.UserConvertor;
import ai.starwhale.mlops.domain.user.po.UserEntity;
import java.util.Date;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class JobConverterTest {

    private JobConvertor jobConvertor;

    @BeforeEach
    public void setUp() {
        UserConvertor userConvertor = mock(UserConvertor.class);
        given(userConvertor.convert(any(UserEntity.class)))
                .willReturn(UserVo.builder().build());

        RuntimeService runtimeService = mock(RuntimeService.class);
        given(runtimeService.findRuntimeByVersionIds(anyList()))
                .willReturn(List.of(RuntimeVo.builder().id("1").build()));
        JobDatasetVersionMapper jobDatasetVersionMapper = mock(JobDatasetVersionMapper.class);
        given(jobDatasetVersionMapper.listDatasetVersionsByJobId(anyLong()))
                .willReturn(List.of(DatasetVersionEntity.builder().id(1L).versionName("v1").build()));
        IdConvertor idConvertor = new IdConvertor();
        SystemSettingService systemSettingService = mock(SystemSettingService.class);
        when(systemSettingService.queryResourcePool(anyString())).thenReturn(ResourcePool.defaults());
        jobConvertor = new JobConvertor(
                idConvertor,
                userConvertor,
                runtimeService,
                jobDatasetVersionMapper,
                systemSettingService
        );
    }

    @Test
    public void testConvert() {
        JobEntity entity = JobEntity.builder()
                .id(1L)
                .jobUuid("job-uuid")
                .owner(UserEntity.builder().build())
                .modelName("model")
                .modelVersion(ModelVersionEntity.builder().versionName("v1").build())
                .runtimeVersionId(1L)
                .createdTime(new Date(1000L))
                .jobStatus(JobStatus.SUCCESS)
                .finishedTime(new Date(1001L))
                .comment("job-comment")
                .resourcePool("rp")
                .build();

        var res = jobConvertor.convert(entity);
        assertThat(res, allOf(
                notNullValue(),
                hasProperty("id", is("1")),
                hasProperty("uuid", is("job-uuid")),
                hasProperty("owner", isA(UserVo.class)),
                hasProperty("modelName", is("model")),
                hasProperty("modelVersion", is("v1")),
                hasProperty("createdTime", is(1000L)),
                hasProperty("runtime", isA(RuntimeVo.class)),
                hasProperty("datasets", isA(List.class)),
                hasProperty("jobStatus", is(JobStatus.SUCCESS)),
                hasProperty("stopTime", is(1001L)),
                hasProperty("comment", is("job-comment")),
                hasProperty("resourcePool", is("default"))
        ));
    }

    @Test
    public void testRevert() {
        assertThrows(UnsupportedOperationException.class,
                () -> jobConvertor.revert(JobVo.builder().build()));
    }
}
