/*
 * Copyright 2022.1-2022
 * StarWhale.com All right reserved. This software is the confidential and proprietary information of
 * StarWhale.com ("Confidential Information"). You shall not disclose such Confidential Information and shall use it only
 * in accordance with the terms of the license agreement you entered into with StarWhale.com.
 */

package ai.starwhale.mlops.common;

import java.time.LocalDateTime;

public class BaseEntity {

    private String modifyUser;
    private String createUser;

    private LocalDateTime createdTime;

    private LocalDateTime modifiedTime;
}
