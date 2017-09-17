function CubicBezier(p0, p1, p2, p3, t, prevPoint) {
    var x = p0.x * (1 - t) * (1 - t) * (1 - t) + p1.x * 3 * (1 - t) * (1 - t) * t + p2.x * 3 * (1 - t) * t * t + p3.x * t * t * t,
        y = p0.y * (1 - t) * (1 - t) * (1 - t) + p1.y * 3 * (1 - t) * (1 - t) * t + p2.y * 3 * (1 - t) * t * t + p3.y * t * t * t,
        perimeter = prevPoint ? Math.sqrt((prevPoint.x - x) * (prevPoint.x - x) + (prevPoint.y - y) * (prevPoint.y - y)) : 0;
    return {
        x: x,
        y: y,
        perimeter: perimeter
    }
}

function setPercentage(point_arr) {
    var start, end, len, perimeter = 0,
        perArr = [0];
    for (var i = 1; i < point_arr.length; i++) {
        start = point_arr[i - 1];
        end = point_arr[i];
        len = BezierLength([{
            x: start.x,
            y: start.y
        }, {
            x: start.x_end,
            y: start.y_end
        }, {
            x: end.x_start,
            y: end.y_start
        }, {
            x: end.x,
            y: end.y
        }], 200);
        perimeter += len;
        perArr.push(perimeter);
    };
    // 计算线段百分比
    point_arr.forEach(function(p, i) {
        p.percentage = perArr[i] / perimeter;
    });
}

function BezierLength(cp, numberOfPoints) {
    var dt = 1 / (numberOfPoints - 1),
        l = 0,
        o,
        arr = [];
    for (i = 0; i < numberOfPoints; i++) {
        o = CubicBezier(cp[0], cp[1], cp[2], cp[3], i * dt, arr[i - 1]);
        arr.push(o);
        l += o.perimeter;
    }
    return l;
}

function translateTemp(x, y) {
    return "-webkit-transform:translate(" + x + "," + y + ")";
}

function px2unit(length, unit) {
    if (unit == 'rem') {
        return length / 50 + 'rem';
    } else if (unit == 'percentage') {
        return length * 100 / 375 + '%';
    } else {
        return length + 'px';
    }
}

function addClass(elem, className) {
    if (elem.className.search(new RegExp('(^|\\s)' + className + '(?=($|\\s))', 'i')) < 0) {
        elem.className += ' ' + className;
    }
}

function removeClass(elem, className) {
    elem.className = elem.className.replace(new RegExp('(^|\\s)' + className + '(?=($|\\s))', 'i'), '');
}

function outputCSS(points, option) {
    option = option || {};
    var l = option.pointsCount || 80, // 帧数
        index = 0, //当前锚点
        per = 0, // 点百分比
        pes = 0, // 
        sp, // 开始锚点
        ep, // 结束锚点
        dl,
        pathLength = 0,
        txt = '';
    while (index <= l) {
        per = index / l; // 帧
        // 根据时间函数，调整贝塞尔或直线
        time = option.timingFunction == 'linear' ? {
            y: per
        } : CubicBezier({
            x: 0,
            y: 0,
        }, {
            x: option.motion_p0x,
            y: option.motion_p0y
        }, {
            x: option.motion_p1x,
            y: option.motion_p1y
        }, {
            x: 1,
            y: 1
        }, per);
        index++;
        ep = sp = points[0];
        // 通过i找到点所在百分比范围
        // console.log(per, time.x, time.y);
        points.find(function(p, i) {
            // if (p.percentage != 0 && p.percentage >= per) {
            if (p.percentage != 0 && p.percentage >= time.y) {
                ep = points[i];
                sp = points[i - 1];
                return true;
            }
        });
        // pes = (per - sp.percentage) / (ep.percentage - sp.percentage);
        pes = (time.y - sp.percentage) / (ep.percentage - sp.percentage);
        pos = CubicBezier({
            x: sp.x,
            y: sp.y
        }, {
            x: sp.x_end,
            y: sp.y_end
        }, {
            x: ep.x_start,
            y: ep.y_start
        }, {
            x: ep.x,
            y: ep.y
        }, pes);
        txt += (per * 100).toFixed(4) + "%{" + [
            translateTemp(px2unit(pos.x - option.referenceX, option.unit), px2unit(pos.y - option.referenceY, option.unit)),
            option.alignCenter ? 'translate(-50%,-50%)' : ''
        ].join(' ') + '}\n';
    };
    return txt;
}
var XMLNS = 'http://www.w3.org/2000/svg';
var Coord = function(containId) {
    var _Coord = {};
    _Coord.contain = document.getElementById(containId);
    _Coord.svg = document.createElementNS(XMLNS, 'svg');
    _Coord.clientHeight = document.documentElement.clientHeight;
    _Coord.clientWidth = document.documentElement.clientWidth;
    _Coord.svg.height = _Coord.clientHeight;
    _Coord.svg.width = _Coord.clientWidth;
    _Coord.x = _Coord.clientWidth / 2;
    _Coord.y = _Coord.clientHeight / 2;
    _Coord.currentPath = null;
    _Coord.state = {
        canTransform: false, // space
        pointMode: false, // shift
        lineMode: false, // alt
        canRemove: false, // r
    }
    _Coord.paths = [];
    _Coord.points = {};
    _Coord.option = {};
    _Coord.contain.appendChild(_Coord.svg);
    _Coord.tip = (function() {
        var div = document.createElement('div'),
            span = document.createElement('span');
        div.className = 'tip';
        div.appendChild(span);
        _Coord.contain.appendChild(div);

        function show(type) {

            div.className = 'tip active';
            var txt = '';
            switch (type) {
                case "point":
                    txt = "点击添加锚点或拖拽锚点";
                    break;
                case "line":
                    txt = "可拖拽操控点";
                    break;
                case "transform":
                    txt = "可拖拽面板和路径";
                    break;
                case "remove":
                    txt = "点击移除锚点或操控点";
                    break;
            }
            span.innerHTML = txt;
        }

        function hide() {
            div.className = 'tip';
        }
        return {
            show: show,
            hide: hide
        }
    })();
    _Coord.setCurrentPath = function(id) {
        _Coord.paths.forEach(function(path) {
            if (path == id || path.id == id) {
                path.active(true);
                _Coord.currentPath = path;
            } else {
                path.active(false);
            }
        });
        return _Coord.currentPath;
    };
    _Coord.removePath = function(id) {
        _Coord.paths.forEach(function(path) {
            if (path == id || path.id == id) {
                path.remove();
            }
        })
    };
    _Coord.setOption = function(opt) {
        (!opt || opt.standard !== undefined) && (this.option["standard"] = !!(opt && opt.standard) || ['w3c', 'webkit']);
    };
    // 拖动坐标系
    // 缩放坐标系
    // 添加路径
    _Coord.path = function(opt) {
        this.moveBy = function(dx, dy) {
            point_arr.forEach(function(point, i) {
                point.movePointBy(dx, dy);
            });
        }
        this.active = function(bool) {
            this._active = bool;
            svg_path.setAttribute("stroke", bool ? "#000" : "#CCC");
            this.referenceDom_Y.style.display = bool ? null : 'none';
            this.referenceDom_X.style.display = bool ? null : 'none';
            point_arr.forEach(function(p) {
                bool ? p.show() : p.hide();
            });
        }
        this.pointActive = function(bool) {}
        this.addPoint = function(x, y, type, index) {
            point_arr.splice(index || point_arr.length, 0, new _Coord.point(that, x, y, type))
            that.draw();
        };
        this.removePoint = function(point) {
            point_arr = point_arr.filter(function(p, i) {
                if (point == p || point == p.id) {
                    p.remove();
                    return false;
                }
                return true;
            });
            this.draw();
        }
        this.isShow = true;
        this.draw = function() {
            svg_path.setAttribute("stroke", this._active ? "#000" : "#CCC");
            svg_path.setAttribute("fill", "none");
            svg_path.setAttribute("stroke-width", "2");
            var prev,
                p = '';
            // 绘制SVG路径
            point_arr.forEach(function(point, i, arr) {
                if (i == 0) {
                    p += 'M' + [point.x, point.y].join(' ');
                } else {
                    prev = arr[i - 1];
                    p += 'C' + [
                        [prev.x_end, prev.y_end].join(' '), [point.x_start, point.y_start].join(' '), [point.x, point.y].join(' ')
                    ].join(',');
                }
            });
            svg_path.setAttribute("d", p);
            // 根据长度设置比例
            setPercentage(point_arr, this.option);
            // 输出样式
            var css = this.print();
            this.style.innerHTML = css;
            _Coord.onCssChange && _Coord.onCssChange(css);
        };
        this.moveReference = function(x, y) {
            if (typeof x == 'number') {
                this.referenceDom_X.style.left = x + 'px';
                this.option.referenceX = x;
            }
            if (typeof y == 'number') {
                this.referenceDom_Y.style.top = y + 'px';
                this.option.referenceY = y;
            }
            this.draw();
        };
        this.setReferenceTip = function(display) {
            if (display) {
                this.referenceDom_tip.innerHTML = this.option.referenceX + 'px,' + this.option.referenceY + 'px';
                this.referenceDom_tip.style.left = this.option.referenceX + 'px';
                this.referenceDom_tip.style.top = this.option.referenceY + 'px';
                this.referenceDom_tip.style.display = 'block';
            } else {
                this.referenceDom_tip.style.display = 'none';
            }
        };
        // CSS 输出
        this.print = function() {
            // 输出样式
            if (!point_arr.length) {
                return;
            }
            var cssText = outputCSS(point_arr, this.option);
            return '.' + this.option.className + '{' +
                'left:' + this.option.referenceX + 'px;' +
                'top:' + this.option.referenceY + 'px;' +
                '\n-webkit-animation:' + [
                    this.option.className, // 类名
                    this.option.duration + 'ms', // 持续时间
                    // 'linear', // 速度曲线
                    'steps(' + this.option.pointsCount + ')',
                    this.option.delay + 'ms', // 延迟时间
                    this.option.iterationCount, // 播放次数
                    this.option.direction ? 'alternate' : "normal" // 反向
                ].join(' ') + ';}' +
                '\n@-webkit-keyframes ' + this.option.className + '{' + cssText + '}';
        };
        this.remove = function() {
            _Coord.svg.removeChild(svg_path, _Coord.svg);
            this.element.parentNode.removeChild(this.element, this.element.parentNode);
            this.referenceDom_Y.parentNode.removeChild(this.referenceDom_Y, this.referenceDom_Y.parentNode);
            this.referenceDom_X.parentNode.removeChild(this.referenceDom_X, this.referenceDom_X.parentNode);
            this.style.parentNode.removeChild(this.style, this.style.parentNode);
            point_arr.forEach(function(point, i) {
                point.remove();
            });
        };
        this.setOption = function(opt) {
            (!opt || opt.duration !== undefined) && (this.option["duration"] = parseInt(opt && opt.duration) ? parseInt(opt.duration) : 2000);
            (!opt || opt.iterationCount !== undefined) && (this.option["iterationCount"] = parseInt(opt && opt.iterationCount) ? parseInt(opt.iterationCount) : 'infinite');
            (!opt || opt.delay !== undefined) && (this.option["delay"] = parseInt(opt && opt.delay) ? parseInt(opt.delay) : 0);
            (!opt || opt.className !== undefined) && (this.option["className"] = (opt && opt.className) || ('coordpath-' + this.id));
            (!opt || opt.alignCenter !== undefined) && (this.option["alignCenter"] = !!(opt && opt.alignCenter) || true);
            (!opt || opt.direction !== undefined) && (this.option["direction"] = !!(opt && opt.direction) || false);
            (!opt || opt.unit !== undefined) && (this.option["unit"] = (opt && opt.unit) || 'px');
            (!opt || opt.referenceX !== undefined) && (this.option["referenceX"] = parseInt(opt && opt.referenceX) ? parseInt(opt.referenceX) : window.document.documentElement.clientWidth / 2);
            (!opt || opt.referenceY !== undefined) && (this.option["referenceY"] = parseInt(opt && opt.referenceY) ? parseInt(opt.referenceY) : window.document.documentElement.clientHeight / 2);
            (!opt || opt.image !== undefined) && (this.option["image"] = opt && opt["image"] || {
                src: "",
                width: 0,
                height: 0
            });
            (!opt || opt.timingFunction !== undefined) && (this.option["timingFunction"] = opt && opt["timingFunction"] || "linear");
            if (this.option["timingFunction"] !== "cubic-bezier") {
                this.option.motion_p0x = this.option.motion_p0y = 0;
                this.option.motion_p1x = this.option.motion_p1y = 1;
            } else {
                (!opt || opt.motion_p0x !== undefined) && (this.option["motion_p0x"] = opt && Number(opt["motion_p0x"]) || 0);
                (!opt || opt.motion_p0y !== undefined) && (this.option["motion_p0y"] = opt && Number(opt["motion_p0y"]) || 0);
                (!opt || opt.motion_p1x !== undefined) && (this.option["motion_p1x"] = opt && Number(opt["motion_p1x"]) || 1);
                (!opt || opt.motion_p1y !== undefined) && (this.option["motion_p1y"] = opt && Number(opt["motion_p1y"]) || 1);
            }

            // 值关联转换
            (!opt || opt.className !== undefined) && (this.element["className"] = 'coord-elem ' + this.option.className);
            (!opt || opt.pointsCount !== undefined) && (this.option["pointsCount"] = this.option.duration / 25);
        };
        this.setImage = function(src, width, height) {
            this.element.style.backgroundImage = 'url(' + src + ')';
            this.element.style.width = px2unit(width, this.option.unit);
            this.element.style.height = px2unit(height, this.option.unit);
        };
        // init
        var that = this;
        // 锚点集合
        var point_arr = [];
        _Coord.paths.push(this);
        var svg_path = document.createElementNS(XMLNS, 'path');
        this.id = _Coord.guid();
        this.element = document.createElement('div');
        this.referenceDom_Y = document.createElement('span');
        this.referenceDom_X = document.createElement('span');
        this.referenceDom_tip = document.createElement('span');
        this.style = document.createElement('style');
        this.option = {};
        this.setOption();
        // 添加样式
        document.head.appendChild(this.style);
        // 添加参考系标尺
        this.referenceDom_Y.className = "coord-reference-Y";
        this.referenceDom_Y.dataset["type"] = "referenceY";
        this.referenceDom_tip.className = "coord-reference-tip";
        this.referenceDom_X.dataset["type"] = "referenceX";
        this.referenceDom_X.className = "coord-reference-X";
        _Coord.contain.appendChild(this.referenceDom_Y);
        _Coord.contain.appendChild(this.referenceDom_X);
        _Coord.contain.appendChild(this.referenceDom_tip);
        this.moveReference(this.option.referenceX, this.option.referenceY);
        // 添加点容器
        _Coord.contain.appendChild(this.element);
        // 添加路径
        _Coord.svg.appendChild(svg_path);
    }
    _Coord.point = function(path, x, y) {
        this.x = x;
        this.y = y;
        this.x_start = x;
        this.y_start = y;
        this.x_end = x;
        this.y_end = y;
        this.path = path;
        this.id = _Coord.guid();
        this.percentage = 0; //当前锚点在路径上
        var that = this;
        var point = document.createElement('div'),
            dot_start = document.createElement('div'),
            dot_start_path = document.createElementNS(XMLNS, 'line'),
            dot_end = document.createElement('div'),
            dot_end_path = document.createElementNS(XMLNS, 'line');
        // point
        point.dataset["type"] = 'point';
        point.dataset["pointid"] = this.id;
        point.className = 'coord-point';
        point.style.left = x + 'px';
        point.style.top = y + 'px';
        // dot_start
        dot_start.dataset["type"] = 'dot_start';
        dot_start.dataset["pointid"] = this.id;
        dot_start.className = 'coord-dot';
        dot_start.style.left = x + 'px';
        dot_start.style.top = y + 'px';

        // dot_end
        dot_end.dataset["type"] = 'dot_end';
        dot_end.dataset["pointid"] = this.id;
        dot_end.className = 'coord-dot';
        dot_end.style.left = x + 'px';
        dot_end.style.top = y + 'px';

        _Coord.points[this.id] = this;
        _Coord.contain.appendChild(point);
        _Coord.contain.appendChild(dot_end);
        _Coord.contain.appendChild(dot_start);
        _Coord.svg.appendChild(dot_end_path);
        _Coord.svg.appendChild(dot_start_path);

        dot_start_path.setAttribute("stroke", "#000");
        dot_start_path.setAttribute("fill", "none");
        dot_start_path.setAttribute("stroke-width", "1");
        dot_start_path.setAttribute("stroke-dasharray", "3");
        dot_end_path.setAttribute("stroke", "#000");
        dot_end_path.setAttribute("fill", "none");
        dot_end_path.setAttribute("stroke-width", "1");
        dot_end_path.setAttribute("stroke-dasharray", "3");

        this.draw = function(type) {
            var dot = type == 'start' ? dot_start_path : dot_end_path;
            dot.setAttribute("x1", this.x);
            dot.setAttribute("y1", this.y);
            dot.setAttribute("x2", this["x_" + type]);
            dot.setAttribute("y2", this["y_" + type]);
        };
        this.movePointTo = function(x, y) {
            var dx = x - this.x,
                dy = y - this.y;
            that.movePointBy(dx, dy);
        };
        this.movePointBy = function(dx, dy) {
            this.x += dx;
            this.y += dy;
            this.x_start += dx;
            this.y_start += dy;
            this.x_end += dx;
            this.y_end += dy;
            point.style.left = this.x + 'px';
            point.style.top = this.y + 'px';
            dot_start.style.left = this.x_start + 'px';
            dot_start.style.top = this.y_start + 'px';
            dot_end.style.left = this.x_end + 'px';
            dot_end.style.top = this.y_end + 'px';
            this.draw('start');
            this.draw('end');
            this.path.draw();

        }
        this.moveDotTo = function(type, x, y) {
            if (type == 'dot_start') {
                this.x_start = x;
                this.y_start = y;
                dot_start.style.left = x + 'px';
                dot_start.style.top = y + 'px';
                this.draw('start');
                this.path.draw();
            } else if (type == 'dot_end') {
                this.x_end = x;
                this.y_end = y;
                dot_end.style.left = x + 'px';
                dot_end.style.top = y + 'px';
                this.draw('end');
                this.path.draw();
            }
        };
        this.removeDot = function(type) {
            this.moveDotTo(type, this.x, this.y);
        }
        this.remove = function() {
            point.parentNode.removeChild(point);
            dot_start.parentNode.removeChild(dot_start);
            dot_start_path.parentNode.removeChild(dot_start_path);
            dot_end.parentNode.removeChild(dot_end);
            dot_end_path.parentNode.removeChild(dot_end_path);
        }
        this.show = function() {
            point.style.display = null;
            dot_start.style.display = null;
            dot_start_path.style.display = null;
            dot_end.style.display = null;
            dot_end_path.style.display = null;
        }
        this.hide = function() {
            point.style.display = 'none';
            dot_start.style.display = 'none';
            dot_start_path.style.display = 'none';
            dot_end.style.display = 'none';
            dot_end_path.style.display = 'none';
        }
    };
    // guid
    _Coord.guid = function() {
        // return 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        return 'xxxxxxxxxxxxxxxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    _Coord.setState = function(type) {
        _Coord.state.pointMode = type == 'point';
        _Coord.state.lineMode = type == 'line';
        _Coord.state.canRemove = type == 'remove';
        _Coord.state.canTransform = type == 'transform';
        document.body.className = (type ? 'coord-mode-' + type : '');
        if (type) {
            _Coord.tip.show(type);
        } else {
            _Coord.tip.hide();
        }
    };
    // 键盘切换状态
    window.addEventListener('keydown', function(event) {
        _Coord.state.pointMode = event.keyCode === 16; // shift
        _Coord.state.canRemove = event.keyCode === 82; // r
        _Coord.state.lineMode = event.keyCode === 18; // alt
        _Coord.state.canTransform = event.keyCode === 32; //space
        var type = (_Coord.state.pointMode && 'point') ||
            (_Coord.state.lineMode && 'line') ||
            (_Coord.state.canRemove && 'remove') ||
            (_Coord.state.canTransform && 'transform') || '';
        document.body.className = (type ? 'coord-mode-' + type : '');
        if (type) {
            _Coord.tip.show(type);
        } else {
            _Coord.tip.hide();
        }
        event.stopPropagation();
        event.preventDefault = true;
    });
    // 键盘取消模式
    window.addEventListener('keyup', function() {
        _Coord.state.pointMode = false;
        _Coord.state.lineMode = false;
        _Coord.state.canTransform = false;
        _Coord.state.canRemove = false;
        document.body.className = "";
        currentPoint = null;
        _Coord.tip.hide();
    });
    // 点拖放事件
    var currentPoint = null,
        currentType = null,
        mouseIsDown = false,
        event_pos = {}
    _Coord.contain.addEventListener('contextmenu', function() {
        _Coord.state.canTransform = true; //space
        event.preventDefault();
        event.stopPropagation();
    });
    _Coord.contain.addEventListener('mousedown', function(event) {
        // console.log(event);
        if (!_Coord.currentPath) {
            return;
        }
        mouseIsDown = true;
        addClass(_Coord.contain, 'paused');
        currentType = event.target.dataset['type'];
        var pointId = event.target.dataset['pointid'];
        event_pos.x = event.x;
        event_pos.y = event.y;
        // 判断是否锚点
        if (currentType === 'point') {
            currentPoint = _Coord.points[pointId];
        }
        // 判断是否操控点，且是否闭合
        if (currentType === 'dot_start' || currentType === 'dot_end') {
            currentPoint = _Coord.points[pointId];
            if (
                currentPoint.x_start == currentPoint.x &&
                currentPoint.x_end == currentPoint.x &&
                currentPoint.y_start == currentPoint.y &&
                currentPoint.y_end == currentPoint.y
            ) {
                currentPoint.isCompound = true;
            } else {
                currentPoint.isCompound = false;
            }
        }
        // 判断是否路径位移
        if (_Coord.state.canTransform) {

        }
        // 判断是否移除锚点
        if (_Coord.state.canRemove && currentType == 'point') {
            currentPoint.path.removePoint(currentPoint);
        }
        // 判断是否移除操控点
        if (_Coord.state.canRemove && (currentType == 'dot_start' || currentType == 'dot_end')) {
            currentPoint.removeDot(currentType, currentPoint.x, currentPoint.y);
        }
        // 判断是否添加锚点
        if (_Coord.state.pointMode && _Coord.svg == event.target) {
            _Coord.currentPath.addPoint(event.x, event.y, 'point');
        }
        event.preventDefault();
        event.stopPropagation();
    });
    // _Coord.contain.addEventListener('mouseup', function(event) {
    document.body.addEventListener('mouseup', function(event) {
        if (_Coord.currentPath) {
            _Coord.currentPath.setReferenceTip(false);
        }
        currentPoint = null;
        currentType = null;
        mouseIsDown = false;
        removeClass(_Coord.contain, 'paused');
    });
    // 鼠标移动
    document.body.addEventListener('mousemove', function(event) {
        if (!_Coord.currentPath) {
            return;
        }
        var dir_x = event.x - event_pos.x,
            dir_y = event.y - event_pos.y;
        event_pos.x = event.x;
        event_pos.y = event.y;
        if (_Coord.state.pointMode && currentPoint && currentPoint.movePointTo) {
            // 锚点移动
            currentPoint.movePointTo(event.x, event.y);
        } else if (_Coord.state.canTransform && mouseIsDown) {
            // 路径移动
            // currentPoint.path.moveBy(dir_x, dir_y);
            _Coord.currentPath.moveBy(dir_x, dir_y);
        } else if (_Coord.state.lineMode && currentPoint && currentPoint.moveDotTo) {
            // 操控点移动
            if (currentPoint.isCompound) {
                currentPoint.moveDotTo('dot_start', event.x, event.y);
                currentPoint.moveDotTo('dot_end', currentPoint.x * 2 - event.x, currentPoint.y * 2 - event.y);
            }
            currentPoint.moveDotTo(currentType, event.x, event.y);
        } else if (currentType == 'referenceX') {
            _Coord.currentPath.moveReference(event.x);
            _Coord.currentPath.setReferenceTip(true);

        } else if (currentType == 'referenceY') {
            _Coord.currentPath.moveReference(undefined, event.y);
            _Coord.currentPath.setReferenceTip(true);
        }
    });
    return _Coord;
}