var path = require('path'), fs=require('fs');

const filterFunctionWithExtension = (name, exts) => {
    let flag = false;
    for(let i = 0 ; i < exts.length ; i++){
        let ckStr =  "\."+exts[i]+"$";
        var re = new RegExp( ckStr , 'g');
        if(re.exec(name)) flag = true       
    }
    return flag
}
const isFolder = (dir, folder) => fs.lstatSync(path.join(dir, folder)).isDirectory() ;

function getAllFilesWithExt(newPath, exts) {
    let files = [];

    function populateFiles(startPath , filter){
        // if not an array, convert it to one. This one is the array of all the extensions 
        if(!Array.isArray(filter)) filter = [filter];
    
        // Array of all the files and folders in a directory
        let allFiles = fs.readdirSync(startPath);
        allFiles = allFiles.filter(file=> ( file!=="node_modules" && (filterFunctionWithExtension(file, filter) || isFolder(startPath, file)) ));
        allFiles = allFiles.map(file=>path.join(startPath, file));
        let allFolders = allFiles.filter(file=> fs.lstatSync(file).isDirectory());
        allFiles = allFiles.filter(file=> !fs.lstatSync(file).isDirectory());
        files = [...files, ...allFiles];
        if(allFolders.length>0) {
            for(let i = 0 ; i < allFolders.length ; i++) populateFiles(allFolders[i], filter);
        }
    }

    populateFiles(newPath, exts);

    return files;
}

const replaceSlashes = (str) => str.replace(/\\/g, '/');

module.exports = {getAllFilesWithExt, filterFunctionWithExtension, replaceSlashes};
