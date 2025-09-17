./build.sh

mkdir -p /var/www/html/post-offices-cro
sudo rm -rf /var/www/html/post-offices-cro/*
sudo cp -r dist/* /var/www/html/post-offices-cro/
