#! /bin/bash

# Variables
location="/var/www/verbi/"
directory="faili"
backuplocation="/var/www/verbi/backup/monthly"
log="/var/www/verbi/backup/backupMonthly.log"

echo -e "\nBackup started: `date`" >> $log

if [ -d $backuplocation ]; then

cd $location
tar -cvzf $backuplocation/data.`date +%H%M%S`.tar.gz $directory

find /var/www/verbi/backup/hourly -mtime +30 -type f -exec rm {} \;

echo " completed: `date`" >> $log
cp $log $backuplocation/backup.log
echo -e "\n — Backup completed –\n";
else

echo " FAILED: `date`" >> $log
echo -e "\n– WARNING: –"
echo -e "– BACKUP FAILED –\n";
fi
