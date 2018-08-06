'use strict';

function GrabRobot() {
    //this.mCurrentMousePos;
    this.mTargets = [];
    this.mListen = false;
    this.mCurIdx = 0;
    this.mDOMChangedHandler = this.firstTouch;
    this.mMonitorProcedure = this.ensureKeyEvent.bind(this);
    this.mUpdateMousePosition = this.updateMousePosition.bind(this);
    this.mHandleKeydown = this.handleKeydown.bind(this);
    this.mDig = this.dig.bind(this);
    this.mDetectBigPhotoIcon = this.detectBigPhotoIcon.bind(this);
    this.mCollapse = this.collapse.bind(this);
    this.mDetectBigPhotoIconWait = false;
    this.mDigging = false;
    this.mPreviousPic = null;
    this.mGrab = this.grab;
    this.mPipe = new LocalPipe();
    this.observeTop();
    //console.log(this.ensureKeyEvent);
    this.ensureKeyEvent(100);
}

//GrabRobot.prototype.callBackground = function() {}

GrabRobot.prototype.ensureKeyEvent = function(interval) {
    /*if (!this.mListen) {
        return;
    }*/

    if (document.onmousemove !== this.mUpdateMousePosition) {
        document.onmousemove = this.mUpdateMousePosition;  
    }
    if (document.onkeydown !== this.mHandleKeydown) {
        document.onkeydown = this.mHandleKeydown;
    }
    setTimeout(this.mMonitorProcedure, interval, interval);
}

GrabRobot.prototype.updateMousePosition = function(event) {
    var e = event || window.event;
    this.mCurrentMousePos = {'x' : e.screenX, 'y' : e.screenY};
};

GrabRobot.prototype.addElement = function(e) {
    if (!e) {
        return;
    }

    let found = false;
    for (idx in this.mTargets) {
        let l = this.mTargets[idx];
        if (l === e) {
            found = true;
            break;
        }
    }
    if (!found) {
        this.mTargets.push(e);
    }
};

GrabRobot.prototype.nop = function() {
    console.log('user click instead.');
}

GrabRobot.prototype.grab = function() {
    if (this.mCurIdx >= this.mTargets.length) {
        this.mTargets = []; //clean
        this.mCurIdx = 0;
        this.mListen = false;
        return;
    }
    this.mTargets[this.mCurIdx++].click();
}

GrabRobot.prototype.handleKeydown = function(event) {
    console.log(event);
    if (187 === event.keyCode) { // +=
        let p = this.mCurrentMousePos;
        console.log(p);
        let element = document.elementFromPoint(p.x, p.y);
        console.log(element);
        if (element) {
            this.addElement(element);
            console.log(this.mTargets);
        }
    } else if (189 === event.keyCode) { // -_
        this.mListen = !this.mListen;
        if (this.mListen) {
            this.mGrab = this.grab;
            this.mGrab();
        }
    } else if (220 === event.keyCode && event.shiftKey && event.ctrlKey) { // shift+ctrl+|
        this.mListen = !this.mListen;
        this.mGrab = this.mListen ? this.nop : this.grab;
    } else if (221 === event.keyCode && event.shiftKey && event.ctrlKey) { // shift+ctrl+}
        this.mPipe.send('cs://next-album');
    }
};

GrabRobot.prototype.dig = function(digging) {
    digging = typeof digging === 'undefined' ? this.mDigging : digging;
    if (digging || !this.mListen) { return;} 
    let src;
    try {
        this.mDigging = true;
        src = document.querySelectorAll('div.pic_show_box')[0].children[0].children[0].children[0].src;
        if (src === this.mPreviousPic) {
            console.log('previous photo cached, waiting for the new one.');
            setTimeout(this.mDig, 100, false);
        } else if ('about:blank' === src) {
            setTimeout(this.mDig, 100, false);
        } else {
            this.mDigging = false;
            console.log(src);
            this.mPipe.send(src)
            this.mPreviousPic = src;
            //download(src);
            console.log('DOMChanged:exitTouch');
            this.mDOMChangedHandler = this.exitTouch;
            document.querySelectorAll('.multipic_preview')[0].children[0].click();
            setTimeout(this.mCollapse, 100);
        }
    } catch (err) {
        console.log(err);
        setTimeout(this.mDig, 100, false);
    }
}

GrabRobot.prototype.exitTouch = function(event) {
    console.log('exitTouch');
    if (1 !== event.length) {
        return;
    }
    console.log("exit in");
    let r = event[0];
    if (r.addedNodes && r.addedNodes.length === 0) {
        if (r.removedNodes && r.removedNodes.length === 1) {
            console.log('DOMChanged:firstTouch');
            this.mDOMChangedHandler = this.firstTouch;
            this.mGrab();
            //setTimeout(this.grab.bind(this), 100, this.mCurIdx++); // grab next
            /*let targets = document.querySelectorAll('li span a.S_txt1');
            if (targets && targets.length === 5) {                
                this.handleDOMElementChanged = this.firstTouch;
                targets[0].click(); // 收起
                setTimeout(this.grab.bind(this), 100, this.mCurIdx++); // grab next
            }*/
        }
    }
}

GrabRobot.prototype.detectBigPhotoIcon = function(wait) {
    console.log('detectBigPhotoIcon - 1');
    if (wait || !this.mListen) {
        return;
    }
    let targets = document.querySelectorAll('li span a.S_txt1');
    if (targets && targets.length === 5) {
        console.log('detectBigPhotoIcon - 2');
        targets[1].click(); //查看大图
        //setTimeout(this.dig.bind(this), 100);
        this.mDetectBigPhotoIconWait = false;
        this.dig();
        return true;
    } else {
        console.log('detectBigPhotoIcon - 3');
        console.log('li span a.S_txt1 failed.');
        this.mDetectBigPhotoIconWait = true;
        setTimeout(this.mDetectBigPhotoIcon, 100, false);
        return false;
    }
}

GrabRobot.prototype.firstTouch = function(event) {
    if (1 !== event.length) {
        return;
    }
    //let r = event[0];
    //if (r.addedNodes && r.addedNodes.length === 1) {
    //    if (r.removedNodes && r.removedNodes.length === 2) {
            this.detectBigPhotoIcon(this.mDetectBigPhotoIconWait);
    //    }
    //}
}

GrabRobot.prototype.handleDOMElementChanged = function(event) {
    console.log('handleDOMElementChanged:' + (!this.mListen || !this.mDOMChangedHandler));
    console.log(event);
    if (!this.mListen || !this.mDOMChangedHandler) {
        return;
    }
    this.mDOMChangedHandler(event);
}

GrabRobot.prototype.observeTop = function() {
    let e = document.querySelectorAll('.WB_feed.WB_feed_v3.WB_feed_v4');
    if (!e) {
        console.log('top WB_feed not found.');
        return;
    }
    observe(e[0], this.handleDOMElementChanged.bind(this));
}


function fireKeyEvent(el, evtType, keyCode) {  
    var doc = el.ownerDocument,  
        win = doc.defaultView || doc.parentWindow,  
        evtObj;  
    if (doc.createEvent) {  
        if (win.KeyEvent) {  
            evtObj = doc.createEvent('KeyEvents');  
            evtObj.initKeyEvent( evtType, true, true, win, false, false, false, false, keyCode, 0 );  
        } else {  
            evtObj = doc.createEvent('UIEvents');  
            Object.defineProperty(evtObj, 'keyCode', {  
                get : function() { return this.keyCodeVal; }  
            });       
            Object.defineProperty(evtObj, 'which', {  
                get : function() { return this.keyCodeVal; }  
            });  
            evtObj.initUIEvent( evtType, true, true, win, 1 );  
            evtObj.keyCodeVal = keyCode;  
            if (evtObj.keyCode !== keyCode) {  
                console.log("keyCode " + evtObj.keyCode + " 和 (" + evtObj.which + ") 不匹配");  
            }  
        }  
        el.dispatchEvent(evtObj);  
    } else if (doc.createEventObject) {  
        evtObj = doc.createEventObject();  
        evtObj.keyCode = keyCode;  
        el.fireEvent('on' + evtType, evtObj);  
    }  
}  

function observe(e, cb) {
    let MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    if (MutationObserver) {
        let MutationObserverConfig = {
            childList: true,
            subtree: true,
            characterData: true
        };
        let observer = new MutationObserver(cb);
        observer.observe(e, MutationObserverConfig);
    }
    else if (e.addEventListener) {
        e.addEventListener("DOMSubtreeModified", cb, false);
    }
    else {
        console.log('unsupported browser');
    }
}

GrabRobot.prototype.collapse = function(interval) {
    if (!this.mListen) { return; }
    console.log('collapse');
    let targets = document.querySelectorAll('li span a.S_txt1');
    try {
        //if (targets && targets.length === 5) {
            targets[0].click(); //收起
            console.log('collapse!!');
        //}
    } catch (err) {
        setTimeout(this.mCollapse, interval, interval);
    }
}

function download(url) {
    console.log(url);
    fetch(url).then(res => res.blob().then(blob => {
        let a = document.createElement('a');
        let urlBlob = window.URL.createObjectURL(blob);
        console.log(urlBlob);
        let filename = url.split('/').pop();
        a.href = urlBlob;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(urlBlob);
    }));
}

function LocalPipe() {
    this.create();
}

LocalPipe.prototype.create = function() {
    let wsServer = 'ws://127.0.0.1:8140/'; 
    let websocket = new WebSocket(wsServer); 
    this.websocket = websocket;
/*
    websocket.onopen = function (evt) { onOpen(evt) }; 
    websocket.onclose = function (evt) { onClose(evt) }; 
    websocket.onmessage = function (evt) { onMessage(evt) }; 
    websocket.onerror = function (evt) { onError(evt) }; 
*/
    websocket.onopen = onOpen.bind(this); 
    websocket.onclose = onClose.bind(this); 
    websocket.onmessage = onMessage.bind(this); 
    websocket.onerror = onError.bind(this); 

    function onOpen(evt) { 
        console.log('onOpen');
    } 
    function onClose(evt) { 
        console.log("onClose");
        setTimeout(this.create.bind(this), 1000);
    } 
    function onMessage(evt) { 
        console.log(evt.data);
    } 
    function onError(evt) { 
        console.log('Error occured: ' + evt.data);
    }
}

LocalPipe.prototype.send = function(message, callback) {
    //alert('send');
    this.waitForConnection(function (self) {
        self.websocket.send(message);
        if (typeof callback !== 'undefined') {
          callback();
        }
    }, 100);
}

LocalPipe.prototype.waitForConnection = function(callback, interval) {
    //alert('wait');
    if (this.websocket.readyState === 1) {
        callback(this);
    } else {
        // optional: implement backoff for interval here
        setTimeout(function () {
            waitForConnection(callback, interval);
        }, interval);
    }
}

var robot = new GrabRobot();

//document.onmousemove = robot.updateMousePosition.bind(robot);
//document.onkeydown = robot.handleKeydown.bind(robot);

//document.querySelectorAll('li span a.S_txt1')  
/*k收起
f查看大图
m向左旋转
n向右旋转

document.querySelectorAll('.scroller') //查看大图窗口弹出
document.querySelectorAll('.icon_maximum')[0].click() // 点击查看原图

*/