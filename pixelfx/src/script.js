const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let pxlData;

let N_FRAMES = 5;

const renderImage = (src = "./Images/test-image.jpg", maxW = 450) => {
    const image = new Image();
    image.src = src;

    image.addEventListener("load", () => {
        canvas.width = image.width; canvas.height = image.height;
        ctx.drawImage(image, 0, 0);

        pxlData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const init = () => {
            window.requestAnimationFrame(draw);
        }

        let n = 0, frames = [], currentEffect = document.getElementById("effects").value;

        effects.forEach(e => (e.name === currentEffect) && (currentEffect = e));

        (document.getElementById("nFrames").value != "") && (N_FRAMES = document.getElementById("nFrames").value);

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        
            currentEffect.f(n);

            ctx.putImageData(pxlData, 0, 0);

            frames.push(canvas.toDataURL());

            if (n < N_FRAMES-1) {
                window.requestAnimationFrame(draw);
                n++;

            } else {
                createFrameButton(frames);
                //downloadFrames(frames);
            }
        }

        init();

    });
}

class Pixel {
    constructor (r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}

const getPixel = (x, y) => {
    const rgba = [];

    for (let i = 0; i < 4; i++) {
        const v = pxlData.data[((y * (pxlData.width * 4)) + (x * 4)) + i];
        rgba.push(v);
    }

    return new Pixel(...rgba);
}

const putPixel = (x, y, pixel) => {
    for (let i = 0; i < 4; i++) {
        pxlData.data[((y * (pxlData.width * 4)) + (x * 4)) + i] = Object.values(pixel)[i];
    }
}

const swapPixels = (regAx, regAy, regBx, regBy, w, h) => {
    const regA = [];

    for (let y = regAy; y < regAy+h; y++) {
        const row = [];

        for (let x = regAx; x < regAx+w; x++) {
            row.push(getPixel(x, y));
        }

        regA.push(row);
    }

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            putPixel(regAx+x, regAy+y, getPixel(regBx+x, regBy+y));
            putPixel(regBx+x, regBy+y, regA[y][x]);
        }
    }
}

const randomSwap = (nswaps, w, h) => {
    for (let i = 0; i < nswaps; i++) {
        swapPixels(
            Math.floor(Math.random() * canvas.width-w), 
            Math.floor(Math.random() * canvas.height-h),
            Math.floor(Math.random() * canvas.width-w), 
            Math.floor(Math.random() * canvas.height-h), w, h);
    }
}

const luminance = (pixel) => (0.2126*pixel.r + 0.7152*pixel.g + 0.0722*pixel.b);

const pixelSortingVertical = (thresh) => {
    console.log(thresh)

    for (let x = 0; x < canvas.width; x++) {
        const threshPxls = {};

        for (let y = 0; y < canvas.height; y++) {
            const pixel = getPixel(x, y);

            const L = luminance(pixel);

            (L > thresh) && (
                threshPxls[L] = {x: x, y: y, p: pixel}
            );
        }

        let sortedPxls = Object.keys(threshPxls).sort((a, b) => a - b);

        for (let i = 0; i < sortedPxls.length; i++) {
            sortedPxls[i] = threshPxls[sortedPxls[i]];
        }

        let yCoords = [];
        sortedPxls.forEach(p => yCoords.push(p.y));
        yCoords = yCoords.sort((a, b) => a - b);

        for (let i = 0; i < yCoords.length; i++) {
            sortedPxls[i].y = yCoords[i];
        }

        sortedPxls.forEach(p => {
            putPixel(p.x, p.y, p.p);
        });

    }
}

const pixelSortingHorizontal = (thresh) => {
    for (let y = 0; y < canvas.height; y++) {
        const threshPxls = {};

        for (let x = 0; x < canvas.width; x++) {
            const pixel = getPixel(x, y);

            const L = luminance(pixel);

            (L < thresh) && (
                threshPxls[L] = {x: x, y: y, p: pixel}
            );
        }

        let sortedPxls = Object.keys(threshPxls).sort((a, b) => a - b);

        for (let i = 0; i < sortedPxls.length; i++) {
            sortedPxls[i] = threshPxls[sortedPxls[i]];
        }

        let xCoords = [];
        sortedPxls.forEach(p => xCoords.push(p.x));
        xCoords = xCoords.sort((a, b) => a - b);

        for (let i = 0; i < xCoords.length; i++) {
            sortedPxls[i].x = xCoords[i];
        }

        sortedPxls.forEach(p => {
            putPixel(p.x, p.y, p.p);
        });

    }
}

const createFrameButton = (frames) => {
    const addBr = () => document.getElementById("framesContainer").appendChild(document.createElement("br"));
    const addBtn = (txt, func) => {
        const btn = document.createElement("a");
        btn.innerHTML = txt;
        btn.classList.add("btnFrames");
        btn.onclick = func;
        document.getElementById("framesContainer").appendChild(btn);

        return btn;
    }
    const removeContents = (id) => {
        const parent = document.getElementById(id);

        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }

    removeContents("framesContainer");

    addBtn("View Frames", () => {
        removeContents("framesContainer");
        addBr();
        displayFrames(frames.slice(0, 5));
        addBr();

        addBtn("View All", () => {
            removeContents("framesContainer");
            addBr();
            displayFrames(frames);
            addBr();

            addBtn("Hide Frames", () => {
                removeContents("framesContainer");
                createFrameButton(frames);
            });
        });
    });
}

const displayFrames = (frames) => {
    for (let i = 0; i < frames.length; i++) {
        const frame = document.createElement("img");
        frame.id = `frame${i}`;
        frame.src = frames[i];
        frame.width = canvas.width * 0.3;
        frame.height = canvas.height * 0.3;

        document.getElementById("framesContainer").appendChild(frame);
    }
}

const downloadFrames = (frames) => { //DELETE
    const zip = new JSZip();
    const folder = zip.folder("Frames");
    
    for (let i = 0; i < frames.length; i++) {
        folder.file(`Frame_${i}.jpg`, frames[i]);
    }

    zip.generateAsync({type:"blob"})
    .then(function(content) {
        // see FileSaver.js
        saveAs(content, "example.zip");
    });
        
}

// Dithering

const getParams = (func) => {
    let str = func.toString();

    str = str.replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/(.)*/g, '')        
            .replace(/{[\s\S]*}/, '')
            .replace(/=>/g, '')
            .trim();

    const start = str.indexOf("(") + 1;
    const end = str.length - 1;
    const result = str.substring(start, end).split(", ");
    const params = [];
 
    result.forEach(element => {
        element = element.replace(/=[\s\S]*/g, '').trim();
        (element.length > 0) && params.push(element);
    });
     
    return params;
}

class Effect {
    constructor (name, func, defParams) {
        this.name = name;
        this.params = getParams(func);
        this.paramValues = [];
        this.f = (n) => {

            for (let i = 0; i < this.params.length; i++) {
                (defParams[i] != undefined && document.getElementById(this.params[i]).value === "") 
                    ? (this.paramValues[i] = eval(defParams[i].replace("n", n))) 
                    : (this.paramValues[i] = eval(document.getElementById(this.params[i]).value.replace("n", n)));
            }

            func(...this.paramValues);
        }
    }
}

const effects = [
    new Effect("Pixel Sorting (Vertical)", pixelSortingVertical, ["n*100"]),
    new Effect("Pixel Sorting (Horizontal)", pixelSortingHorizontal, ["n*100"]),
    new Effect("Random Swap", randomSwap, ["300", "2", "2"]),
];

effects.forEach(e => {
    const option = document.createElement("option");
    option.value = e.name;
    option.innerHTML = e.name;
    document.getElementById("effects").appendChild(option);
});

document.getElementById("effects").onchange = () => {
    const parent = document.getElementById("effectParams");

    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }

    const effect = document.getElementById("effects").value;

    effects.forEach(e => (e.name == effect) && createParams(e.params));
}

const createParams = (params) => {
    params.forEach(p => {
        const element = document.createElement("input");
        element.type = "text";
        element.id = p;
        element.placeholder = p;
        document.getElementById("effectParams").appendChild(element);
        const br = document.createElement("br");
        document.getElementById("effectParams").appendChild(br);
    });

    const nFramesElement = document.createElement("input");
    nFramesElement.type = "number";
    nFramesElement.id = "nFrames";
    nFramesElement.placeholder = "nFrames";

    document.getElementById("effectParams").appendChild(nFramesElement);
}

document.getElementById("btnGenerate").onclick = () => {
    const effect = document.getElementById("effects").value;

    effects.forEach(e => { if (e.name == effect) {
        for (let i = 0; i < e.params.length; i++) {
            e.paramValues[i] = parseInt(document.getElementById(e.params[i]).value);
        }
    }});

    renderImage();
}
