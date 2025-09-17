if [[ -d dist ]]; then
    rm -r dist
fi

npm install

mkdir dist

cp index.html swagger.yml dist/
cp -r js dist/
cp -r css dist/
cp -r assets dist/

node index.js