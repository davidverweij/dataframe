#!/bin/sh

# creates a service and sets up to run at start
cat <<EOT > /lib/systemd/system/dataframe.service
[Unit]
Description=DataFrame running Service
After=multi-user.target

[Service]
Type=idle
ExecStart=/usr/bin/python3 -u /home/pi/dataframe.py
StandardOutput = append:/home/pi/dataframe_output.log
StandardError = append:/home/pi/dataframe_error.log
Restart=always

[Install]
WantedBy=multi-user.target
EOT

chmod 644 /lib/systemd/system/dataframe.service
systemctl daemon-reload
systemctl enable dataframe.service
