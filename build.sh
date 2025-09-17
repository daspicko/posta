if [[ -d dist ]]; then
    rm -r dist
fi

npm install

mkdir dist

cp index.html dist/
cp swagger.yml dist/
cp 404.html dist/

cp -r js dist/
cp -r css dist/
cp -r assets dist/

node index.js