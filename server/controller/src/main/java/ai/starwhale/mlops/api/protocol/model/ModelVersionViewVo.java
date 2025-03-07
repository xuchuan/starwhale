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

package ai.starwhale.mlops.api.protocol.model;

import ai.starwhale.mlops.domain.job.spec.StepSpec;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import javax.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;
import org.springframework.validation.annotation.Validated;

@Data
@Builder
@Validated
@Schema(description = "Model Version View Object", title = "Model")
public class ModelVersionViewVo {

    @NotNull
    private String id;

    @NotNull
    private String versionName;

    @NotNull
    private String alias;

    @NotNull
    private Boolean latest;

    private List<String> tags;

    @NotNull
    private Integer shared;

    @NotNull
    private List<StepSpec> stepSpecs;

    private String builtInRuntime;

    @NotNull
    private Long createdTime;
}
