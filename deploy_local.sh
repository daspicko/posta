./build.sh

mkdir -p /var/www/html/posta
sudo rm -rf /var/www/html/posta/*
sudo cp -r dist/* /var/www/html/posta/
