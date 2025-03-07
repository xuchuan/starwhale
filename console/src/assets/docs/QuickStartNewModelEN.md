A Starwhale Model is a standard format for packaging machine learning models that contains the model file, inference codes, configuration files,

**Step1: Install Starwhale Client by venv**

```
python3 -m venv ~/.cache/venv/starwhale
source ~/.cache/venv/starwhale/bin/activate
python3 -m pip install starwhale

swcli --version

sudo rm -rf /usr/local/bin/swcli
sudo ln -s "$(which swcli)" /usr/local/bin/
```

**Step2: Log in Starwhale Cloud Instance**

```
swcli instance login --username <your username> --password <your password> --alias swcloud https://cloud.starwhale.cn
```

**Step3: Build a new model**

```
swcli model build . --model-yaml /path/to/model.yaml
```

**Step4: See your model displayed here in Starwhale**
