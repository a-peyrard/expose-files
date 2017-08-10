- create working directory
```
$ mkdir expose && cd expose 
```

- install
```
$ sudo npm install -g expose-files
```

- customize
```
$ nano expose.config
```

Here is an example of configuration file:
```
watch=/tmp/private
exposeOut=/tmp/public
port=8443
cert=domain.crt
key=domain.key
smtp=some-valid-email@gmail.com:somePassword
email=my-email@gmail.com
```

- generate key & cert files
```
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout domain.key -out domain.crt
```

- launch 
```
nohup expose-files --config expose.config &
```

- kill
```
ps aux | grep expose-files | awk '{print $2;}' | xargs kill
```

Have fun  🐲 !

