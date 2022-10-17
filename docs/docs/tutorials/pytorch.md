---
title: Build a PyTorch Runtime
---

This tutorial demonstrates how to build a PyTorch runtime for other tutorials. You will learn:
* How to build a runtime
* How to use a runtime during model evaluation and dataset creation
* How to publish a runtime to other instances

# 1. Prerequisites

* Python 3.7+
* Linux / macOS
* [SWCLI](../guides/swcli)

# 2. Download the example

```bash
git clone https://github.com/star-whale/starwhale.git
cd starwhale/example/runtime/pytorch
```

There are two pytorch examples under `starwhale/exmaple`. The one named `pytorch-cn-mirror` is for users reside in the mainland of China. It uses a PyPI mirror instead of `pypi.org`.

# 3. Build the runtime

Run the following command:
```bash
swcli runtime build .
```

When the command finishes without error, the runtime is built successfully. You can use `swcli runtime list` and `swcli runtime info` to see your runtimes.

SWCLI uses `runtime.yaml` to gather all runtime settings. For more information about the yaml, see []().

# 4. Use the runtime

`swcli runtime activate` can be used to create a new shell 