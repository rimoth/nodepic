rm -R /home/tim/Pictures/processing/*
rm -R /home/tim/Pictures/photos/*
rm -R /home/tim/Pictures/index/*
rm -R /home/tim/Pictures/inbox/*
cp -a /home/tim/Pictures/backup/. /home/tim/Pictures/inbox/
node server.js