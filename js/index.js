/**
 * Coord 初始化
 */
var coord = Coord('svg');
var $coord = $("#svg"),
    $pathlist = $("#pathlist"),
    $exportCss = $("#exportCss"),
    $coordOption = $("#coord-option");
$coordPathOption = $("#coord-path-option");
coord.onCssChange = function(cssText) {
    $exportCss.val(cssText);
};
/********************************
 * 路径操作
 */
(function() {
    var bzOption = {
        "linear": [0, 0, 1, 1],
        "ease": [0.25, 0.1, 0.25, 1],
        "ease-in": [0.42, 0, 1, 1],
        "ease-out": [0, 0, 0.58, 1],
        "ease-in-out": [0.42, 0, 0.58, 1]
    }
    $("#addpath").on('click', function() {
        var path = new coord.path();
        coord.setCurrentPath(path);
        showOption(coord.currentPath.option);
        $(this).parent().siblings().removeClass('active');
        $(this).parent().before('<li class="active" path-id="' + path.id + '"><img/><span class="name">' + path.option.className + '</span><span class="remove">X</span></li>');
        return false;
    });
    $("#pathlist").on('click', 'li', function() {
        var pathid = $(this).attr('path-id');
        if (pathid) {
            $(this).addClass('active').siblings().removeClass('active');
            coord.setCurrentPath(pathid);
            showOption(coord.currentPath.option);
        }
    }).on('click', '.remove', function() {
        var pathid = $(this).parent().attr('path-id');
        coord.removePath(pathid);
        $(this).parent().remove();
        hideOption();
        return false;
    });

    // 隐藏配置框
    function hideOption() {
        $coordPathOption.removeClass('active');
    }
    // 显示配置框
    function showOption(data) {
        $coordPathOption.addClass('active');
        var input, type;
        for (var i in data) {
            input = $('[name=' + i + ']');
            type = input.attr("type")
            if (type == 'checkbox' && data[i] instanceof Array) {
                input.each(function() {
                    if (data[i].indexOf(this.value) > -1) {
                        this.checked = true;
                    }
                });
            } else if (type == 'checkbox' && typeof data[i] == 'boolean') {
                input.prop('checked', data[i]);
            } else if (type == 'radio') {
                input.filter('[value=' + data[i] + ']').prop("checked", true);
            } else if (type == "image") {
                input.prop("src", data[i].src);
            } else {
                input.val(data[i]);
            }
        }
        var d = bzOption[data.timingFunction],
            o = {
                x0: d && d[0] || data["motion_p0x"],
                y0: d && d[1] || data["motion_p0y"],
                x1: d && d[2] || data["motion_p1x"],
                y1: d && d[3] || data["motion_p1y"]
            };
        changeBzPoint(o);
        changeBz(o);

    }

})();
/********************************
 * 配置操作
 */
(function() {
    // tab选项
    $(".tab").on('click', "span", function() {
        var $that = $(this);
        if ($that.hasClass('active')) {
            return;
        }
        var s = $that.attr("target");
        $that.addClass('active').siblings().removeClass('active');
        $(".tab-content[frame=" + s + "]").addClass('active').siblings().removeClass('active');
    });
    // 配置框内容变化
    $coordPathOption.on('change', '[type=text],[type=number],:radio,textarea', inputChange);
    $coordPathOption.on('click', ':checkbox', inputChange);

    function inputChange(evt) {
        var target = evt.target,
            name = target.name,
            value = target.value;
        if (target.type == 'checkbox') {
            value = target.checked;
        }
        if (name) {
            if (name == 'standard') {
                value = Array.prototype.map.call($("input[name=standard]:checked"), function(item, i) {
                    return item.value;
                });
            }
            var o = {};
            o[name] = value;
            coord.currentPath.setOption(o);
            coord.currentPath.draw();
        }
    }
})();
/********************************
 * 路径图片上传
 */
(function() {
    // 上传图片
    var $imgInput = $("#imgInput"),
        $imgSrc = $("#imgSrc");
    $("#imgBtn").on('click', function() {
        $imgInput.click();
    });
    $imgSrc.on('load', function() {
        coord.currentPath.setImage(this.src, this.naturalWidth, this.naturalHeight);
        coord.currentPath.setOption({
            'image': {
                src: this.src,
                width: this.naturalWidth,
                height: this.naturalHeight
            }
        })
    });

    $imgInput.on('change', function(evt) {
        var reader = new FileReader();
        reader.onloadend = function() {
            $imgSrc.prop("src", reader.result);
        }
        reader.readAsDataURL(this.files[0]);
    });
})();
(function() {
    // motion
    var $timingFunction = $("#timingFunction"),
        $motionWrap = $("#motionWrap");
    var $motionPoint0 = $("#motionPoint0"),
        $motionPoint1 = $("#motionPoint1"),
        $motionBox = $("#motionBox"),
        $motionSvg = $("#motionSvg"),
        $motionP0x = $("#motionP0x"),
        $motionP0y = $("#motionP0y"),
        $motionP1x = $("#motionP1x"),
        $motionP1y = $("#motionP1y"),
        $motionPath = $("#motionPath"),
        $motionLine1 = $("#motionLine1"),
        $motionLine2 = $("#motionLine2");
    var dom_movingPoint = null,
        motionWidth = 200,
        mx, my, dx, dy,
        motionPos = {
            x0: 0,
            y0: 0,
            x1: 1,
            y1: 1
        };
    // $(document).on('mousedown', function(event) {
    $timingFunction.on("change", function() {
        coord.currentPath.setOption({
            timingFunction: this.value
        });
        if (this.value === 'cubic-bezier') {
            var p = coord.currentPath.option;
            motionPos = {
                x0: p.motion_p0x,
                y0: p.motion_p0y,
                x1: p.motion_p1x,
                y1: p.motion_p1y
            }
        } else {
            var p = $(this).find("option:selected").attr("p").split(',')
            motionPos = {
                x0: p[0],
                y0: p[1],
                x1: p[2],
                y1: p[3]
            };
        }
        changeBz(motionPos);
        changeBzPoint(motionPos);
        $motionP0x.val(motionPos.x0);
        $motionP0y.val(motionPos.y0);
        $motionP1x.val(motionPos.x1);
        $motionP1y.val(motionPos.y1);
        coord.currentPath.draw();

    });
    $motionBox.on('mousedown', '.motion-point', function(event) {
        dx = event.offsetX;
        dy = event.offsetY;
        dom_movingPoint = this;
        $(this).addClass("active");
        $timingFunction.val("cubic-bezier");
        coord.currentPath.setOption({
            timingFunction: "cubic-bezier"
        })

    });
    $motionBox.on('mousemove', function(event) {
        if (!dom_movingPoint) {
            return;
        }
        mx = event.offsetX;
        my = event.offsetY;
        if (event.target == this) {
            mx -= 60;
            my -= 40;
        }
        if (event.target == dom_movingPoint) {
            mx += event.target.offsetLeft + dx;
            my += event.target.offsetTop + dy;
        }
        mx = mx < 0 ? 0 : mx > motionWidth ? motionWidth : mx;
        my = my < 0 ? 0 : my > motionWidth ? motionWidth : my;
        // console.log(mx, my);
        if (dom_movingPoint == $motionPoint0[0]) {
            motionPos.x0 = (mx / motionWidth).toFixed(2);
            motionPos.y0 = (my / motionWidth).toFixed(2);
            $motionP0x.val(motionPos.x0);
            $motionP0y.val(motionPos.y0);

            coord.currentPath.setOption({
                motion_p0x: motionPos.x0,
                motion_p0y: motionPos.y0
            });
        } else if (dom_movingPoint == $motionPoint1[0]) {
            motionPos.x1 = (mx / motionWidth).toFixed(2);
            motionPos.y1 = (my / motionWidth).toFixed(2);
            $motionP1x.val(motionPos.x1);
            $motionP1y.val(motionPos.y1);
            coord.currentPath.setOption({
                motion_p1x: motionPos.x1,
                motion_p1y: motionPos.y1
            });
        }
        dom_movingPoint.style.left = mx + "px";
        dom_movingPoint.style.top = my + "px";
        changeBz(motionPos);
        coord.currentPath.draw();
        return false;
    });
    $motionP0x.on('change', function() {
        motionPos.x0 = this.value;
        $motionPoint0.css("left", this.value * motionWidth);
        coord.currentPath.setOption({
            timingFunction: "cubic-bezier",
            motion_p0x: motionPos.x0
        });
        changeBz(motionPos);
        $timingFunction.val("cubic-bezier");
        coord.currentPath.draw();
    });
    $motionP0y.on('change', function() {
        motionPos.y0 = this.value;
        $motionPoint0.css("top", this.value * motionWidth);
        coord.currentPath.setOption({
            timingFunction: "cubic-bezier",
            motion_p0y: motionPos.y0
        });
        changeBz(motionPos);
        $timingFunction.val("cubic-bezier");
        coord.currentPath.draw();
    });
    $motionP1x.on('change', function() {
        motionPos.x1 = this.value;
        $motionPoint1.css("left", this.value * motionWidth);
        coord.currentPath.setOption({
            timingFunction: "cubic-bezier",
            motion_p1x: motionPos.x1
        });
        changeBz(motionPos);
        $timingFunction.val("cubic-bezier");
        coord.currentPath.draw();
    });
    $motionP1y.on('change', function() {
        motionPos.y1 = this.value;
        $motionPoint1.css("top", this.value * motionWidth);
        coord.currentPath.setOption({
            timingFunction: "cubic-bezier",
            motion_p1y: motionPos.y1
        });
        changeBz(motionPos);
        $timingFunction.val("cubic-bezier");
        coord.currentPath.draw();
    });
    $(document).on('mouseup', function() {
        $(dom_movingPoint).removeClass('active');
        dom_movingPoint = null;
    });
    window.changeBzPoint = function(o) {
        $motionPoint0.css("left", o.x0 * motionWidth);
        $motionPoint0.css("top", o.y0 * motionWidth);
        $motionPoint1.css("left", o.x1 * motionWidth);
        $motionPoint1.css("top", o.y1 * motionWidth);
    }
    window.changeBz = function(o) {
        motionPos = o;
        // console.log("0 0MC" + [o.x0 * motionWidth, o.y0 * motionWidth].join(' ') + "," + [o.x1 * motionWidth, o.y1 * motionWidth].join(' ') + ","+[motionWidth,motionWidth].join(' '))
        // debugger;
        $motionPath.attr("d", "M0 0C" + [o.x0 * motionWidth, o.y0 * motionWidth].join(' ') + "," + [o.x1 * motionWidth, o.y1 * motionWidth].join(' ') + "," + [motionWidth, motionWidth].join(' '));
        $motionLine1.attr({
            x1: 0,
            y1: 0,
            x2: o.x0 * motionWidth,
            y2: o.y0 * motionWidth
        })
        $motionLine2.attr({
            x1: o.x1 * motionWidth,
            y1: o.y1 * motionWidth,
            x2: motionWidth,
            y2: motionWidth
        })
    };
})();
/********************************
 * 参考系设置
 */
(function() {
    // 上传参考
    var $FORInput = $("#FORInput"),
        $FORSrc = $("#FORSrc"),
        $forWidth = $("#forWidth"),
        $forHeight = $("#forHeight");
    $FORSrc.on('load', function() {
        $coord.css("backgroundImage", "url(" + this.src + ")");
        $forWidth.val(this.naturalWidth);
        $forHeight.val(this.naturalHeight);

        $coord.css("background-size", [w + 'px', h + 'px'].join(" "))
            /*$coord.css({
                width: this.naturalWidth,
                height: this.naturalHeight
            });*/
    });
    $("#FORBtn").on('click', function() {
        $FORInput.click();
    });
    $forWidth.on('change', function() {
        if (this.value) {
            var w = this.value,
                h = $forHeight.val() * this.value / $FORSrc.prop("naturalWidth");
            $forHeight.val(h);
            $coord.css("background-size", [w + 'px', h + 'px'].join(" "))
                /*$coord.css({
                    width: w,
                    height: h
                });*/
        }
    })
    $forHeight.on('change', function() {
        if (this.value) {

            var h = this.value,
                w = $forWidth.val() * this.value / $FORSrc.prop("naturalWidth");
            $forWidth.val(h);
            $coord.css("background-size", [w + 'px', h + 'px'].join(" "))
                // $coord.css({
                //     width: w,
                //     height: h
                // });
        }
    })

    $FORInput.on('change', function(evt) {
        var reader = new FileReader();
        reader.onloadend = function() {
            $FORSrc.prop("src", reader.result);
        }
        reader.readAsDataURL(this.files[0]);
    });

})();
/********************************
 * 控制条操作
 */
(function() {
    $(".coord-control").on('click', "span", function() {
        var s = this.className.match(/point|line|move|remove/),
            state = s && s[0];
            // 无状态
            if(!state){
                return;
            }
            // 已存在状态
            if(document.body.className.search(new RegExp('coord-mode-'+state))>-1){
                state = '';
            }
            coord.setState(state)
    });
})();
