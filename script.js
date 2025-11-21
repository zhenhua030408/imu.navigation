// 全局变量
let map, geocoder;
let currentCampus = {
    name: '主校区（赛罕区）',
    lng: 111.690187,
    lat: 40.81253
};
let routeLine = null;
let startMarker = null;
let endMarker = null;
let campusMarkers = []; // 存储校区标记

// DOM元素
const DOM = {
    campusBtn: document.getElementById('campusBtn'),
    campusDropdown: document.getElementById('campusDropdown'),
    currentCampusEl: document.getElementById('currentCampus'),
    campusOptions: document.querySelectorAll('.campus-option'),
    sidePanel: document.getElementById('sidePanel'),
    menuToggle: document.getElementById('menuToggle'),
    overlay: document.getElementById('overlay'),
    routeForm: document.getElementById('routeForm'),
    startPoint: document.getElementById('startPoint'),
    endPoint: document.getElementById('endPoint'),
    swapBtn: document.getElementById('swapBtn'),
    planBtn: document.getElementById('planBtn'),
    placeItems: document.querySelectorAll('.place-item'),
    routeInfoPanel: document.getElementById('routeInfoPanel'),
    closeRouteInfo: document.getElementById('closeRouteInfo'),
    routeTime: document.getElementById('routeTime'),
    routeDistance: document.getElementById('routeDistance'),
    routePath: document.getElementById('routePath'),
    campusChangeNotice: document.getElementById('campusChangeNotice'),
    newCampusName: document.getElementById('newCampusName'),
    loading: document.getElementById('loading')
};

// 校区地点坐标数据
const campusPlaces = {
    main: {  // 主校区（赛罕区）
        '图书馆': { lng: 111.690283, lat: 40.814404 },
        '行政楼': { lng: 111.69258, lat: 40.81192},
        '第一教学楼': { lng: 111.690552, lat: 40.811692 },
        '学生食堂': { lng: 111.692107, lat: 40.812589 },
        '体育馆': { lng: 111.687797, lat: 40.813332},
        '学生宿舍': { lng: 111.688617, lat: 40.810433 }
    },
    yuquan: {  // 玉泉校区 
        '图书馆': { lng: 111.683928, lat: 40.757437 },
        '行政楼': { lng: 111.685794, lat: 40.760293 },
        '第一教学楼': { lng: 111.685393, lat: 40.758977 },
        '学生食堂': { lng: 111.684202, lat: 40.760098 },
        '体育馆': { lng: 111.688373, lat: 40.759787 },
        '学生宿舍': { lng: 111.683040,lat: 40.760538 }
    }
};

// 初始化地图
function initMap() {
    try {
        // 检查AMap是否已加载
        if (typeof AMap === 'undefined') {
            console.error('高德地图API未正确加载');
            DOM.loading.innerHTML = '地图加载失败，请刷新页面重试';
            return;
        }

        // 创建地图实例
        map = new AMap.Map('map-container', {
            zoom: 17,
            center: [currentCampus.lng, currentCampus.lat],
            viewMode: '2D',
            resizeEnable: true
        });

        // 添加比例尺控件
        if (AMap.Scale) {
            const scaleCtrl = new AMap.Scale({ position: 'bottom-left' });
            map.addControl(scaleCtrl);
        }

        // 添加工具栏控件
        if (AMap.ToolBar) {
            const toolBarCtrl = new AMap.ToolBar({ 
                position: 'bottom-right'
            });
            map.addControl(toolBarCtrl);
        }

        // 初始化地理编码
        if (AMap.Geocoder) {
            geocoder = new AMap.Geocoder({
                city: '呼和浩特',
                radius: 1000
            });
        }

        // 地图加载完成后隐藏加载提示
        map.on('complete', function() {
            DOM.loading.style.display = 'none';
            // 初始化标记
            updateCampusMarkers();
        });

        // 绑定事件
        bindEvents();

    } catch (error) {
        console.error('地图初始化失败:', error);
        DOM.loading.innerHTML = '地图初始化失败: ' + error.message;
    }
}

// 更新校区标记
function updateCampusMarkers() {
    if (!map) return;

    // 清除现有标记
    if (campusMarkers.length > 0) {
        map.remove(campusMarkers);
        campusMarkers = [];
    }

    const campusType = currentCampus.name.includes('玉泉') ? 'yuquan' : 'main';
    const places = campusPlaces[campusType];

    // 更新常用地点经纬度
    DOM.placeItems.forEach(item => {
        const placeName = item.dataset.name;
        const placeData = places[placeName];
        if (placeData) {
            item.dataset.lng = placeData.lng;
            item.dataset.lat = placeData.lat;
        }
    });

    // 创建标记
    Object.entries(places).forEach(([name, coords]) => {
        const marker = new AMap.Marker({
            position: [coords.lng, coords.lat],
            title: name,
            icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
            anchor: 'bottom-center'
        });

        marker.setMap(map);
        campusMarkers.push(marker);

        // 绑定点击事件
        marker.on('click', () => {
            showPlaceInfo(name, coords.lng, coords.lat);
        });
    });
}

// 显示地点信息窗口
function showPlaceInfo(name, lng, lat) {
    if (!map) return;

    const infoWindow = new AMap.InfoWindow({
        content: `<div style="padding: 10px;">
                    <h3 style="font-size: 14px; margin-bottom: 5px;">${name}</h3>
                    <div class="marker-actions">
                        <button class="marker-action-btn select-start" data-name="${name}" data-lng="${lng}" data-lat="${lat}">
                            设为起点
                        </button>
                        <button class="marker-action-btn select-end" data-name="${name}" data-lng="${lng}" data-lat="${lat}">
                            设为终点
                        </button>
                    </div>
                  </div>`,
        size: new AMap.Size(180, 80),
        offset: new AMap.Pixel(0, -35)
    });

    infoWindow.open(map, [lng, lat]);

    // 绑定设为起点/终点
    setTimeout(() => {
        const startBtn = document.querySelector('.select-start');
        const endBtn = document.querySelector('.select-end');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                DOM.startPoint.value = startBtn.dataset.name;
                DOM.startPoint.dataset.lng = startBtn.dataset.lng;
                DOM.startPoint.dataset.lat = startBtn.dataset.lat;
                infoWindow.close();
            });
        }
        
        if (endBtn) {
            endBtn.addEventListener('click', () => {
                DOM.endPoint.value = endBtn.dataset.name;
                DOM.endPoint.dataset.lng = endBtn.dataset.lng;
                DOM.endPoint.dataset.lat = endBtn.dataset.lat;
                infoWindow.close();
            });
        }
    }, 100);
}

// 清除路线信息
function clearRouteInfo() {
    // 清除地图上的路线和标记
    if (routeLine) {
        map.remove(routeLine);
        routeLine = null;
    }
    if (startMarker) {
        map.remove(startMarker);
        startMarker = null;
    }
    if (endMarker) {
        map.remove(endMarker);
        endMarker = null;
    }
    
    // 隐藏路线信息面板
    DOM.routeInfoPanel.classList.remove('show');
    
    // 清空输入框
    DOM.startPoint.value = '';
    DOM.endPoint.value = '';
    DOM.startPoint.dataset.lng = '';
    DOM.startPoint.dataset.lat = '';
    DOM.endPoint.dataset.lng = '';
    DOM.endPoint.dataset.lat = '';
}

// 显示校区切换提示
function showCampusChangeNotice(campusName) {
    DOM.newCampusName.textContent = campusName;
    DOM.campusChangeNotice.style.display = 'block';
    
    // 3秒后自动隐藏提示
    setTimeout(() => {
        DOM.campusChangeNotice.style.display = 'none';
    }, 3000);
}

// 切换校区
function switchCampus(campusType, campusName, lng, lat) {
    // 清除当前路线信息
    clearRouteInfo();
    
    // 显示校区切换提示
    showCampusChangeNotice(campusName);

    currentCampus = {
        name: campusName,
        lng: parseFloat(lng),
        lat: parseFloat(lat)
    };

    // 更新UI
    DOM.currentCampusEl.textContent = campusName.includes('玉泉') ? '玉泉校区' : '主校区';
    DOM.campusOptions.forEach(option => {
        option.classList.toggle('active', option.dataset.campus === campusType);
    });

    if (map) {
        // 直接设置地图中心
        map.setCenter([currentCampus.lng, currentCampus.lat]);
        // 更新标记
        updateCampusMarkers();
        // 设置合适的缩放级别
        map.setZoom(17);
    }
}

// 规划路线（自定义路线计算）
function planRoute(startLng, startLat, endLng, endLat, startName, endName) {
    if (!map) return;

    // 清除之前的路线和标记
    if (routeLine) map.remove(routeLine);
    if (startMarker) map.remove(startMarker);
    if (endMarker) map.remove(endMarker);

    // 转换为浮点数，确保坐标精度
    startLng = parseFloat(startLng);
    startLat = parseFloat(startLat);
    endLng = parseFloat(endLng);
    endLat = parseFloat(endLat);

    // 1. 自定义起点/终点标记
    startMarker = new AMap.Marker({
        position: [startLng, startLat],
        icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png',
        anchor: 'bottom-center',
        zIndex: 60
    });

    endMarker = new AMap.Marker({
        position: [endLng, endLat],
        icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_g.png',
        anchor: 'bottom-center',
        zIndex: 60
    });

    startMarker.setMap(map);
    endMarker.setMap(map);

    // 2. 经纬度的直线距离计算实际距离
    const distance = calculateDistance(startLng, startLat, endLng, endLat);
    // 计算预计时间（步行速度：60米/分钟）
    const time = Math.round(distance / 60);

    // 3. 绘制路线
    const path = generateSmoothPath([startLng, startLat], [endLng, endLat]);
    routeLine = new AMap.Polyline({
        path: path,
        strokeColor: '#165dff',
        strokeWeight: 6,
        strokeOpacity: 0.9,
        zIndex: 50,
        strokeStyle: 'solid'
    });
    routeLine.setMap(map);

    // 4.根据距离和方向生成路线描述
    const direction = getDirection(startLng, startLat, endLng, endLat);
    const pathDesc = generateRouteDescription(startName, endName, direction, distance);

    // 5. 更新路线信息面板
    DOM.routeTime.textContent = `${time}分钟`;
    DOM.routeDistance.textContent = (distance / 1000).toFixed(2) + '公里';
    DOM.routePath.textContent = pathDesc;

    // 调整地图视野
    map.setFitView([startMarker, endMarker, routeLine], false, [60, 60, 60, 60]);

    // 显示路线信息面板
    DOM.routeInfoPanel.classList.add('show');

    // 移动端关闭侧边栏
    if (window.innerWidth < 768) {
        DOM.sidePanel.classList.remove('show');
        DOM.overlay.classList.remove('show');
    }
}

// 经纬度转距离
function calculateDistance(lng1, lat1, lng2, lat2) {
    const R = 6371000; // 地球半径（米）
    const radLat1 = Math.PI * lat1 / 180;
    const radLat2 = Math.PI * lat2 / 180;
    const deltaLat = radLat2 - radLat1;
    const deltaLng = Math.PI * (lng2 - lng1) / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(radLat1) * Math.cos(radLat2) *
        Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // 距离（米）
}

//生成平滑路线
function generateSmoothPath(start, end) {
    const [lng1, lat1] = start;
    const [lng2, lat2] = end;
    const path = [start];

    // 起始点终点中间添加1个控制点，使路线略微弯曲
    const midLng = (lng1 + lng2) / 2 + (Math.random() - 0.5) * 0.0005; // 微小偏移
    const midLat = (lat1 + lat2) / 2 + (Math.random() - 0.5) * 0.0005;
    path.push([midLng, midLat]);

    path.push(end);
    return path;
}

// 计算两点之间的方向
function getDirection(lng1, lat1, lng2, lat2) {
    const deltaLng = lng2 - lng1;
    const deltaLat = lat2 - lat1;

    if (Math.abs(deltaLat) > Math.abs(deltaLng)) {
        return deltaLat > 0 ? '向北' : '向南';
    } else {
        return deltaLng > 0 ? '向东' : '向西';
    }
}

// 路线描述
function generateRouteDescription(startName, endName, direction, distance) {
    let desc = `步行导航：从${startName}出发`;

    if (distance < 200) {
        desc += ` → 沿${direction}方向直行`;
    } else if (distance < 500) {
        desc += ` → 沿${direction}方向前行，途经校园主干道`;
    } else {
        desc += ` → 沿${direction}方向直行，穿过教学区/生活区`;
    }

    desc += ` → 到达${endName}`;
    return desc;
}

// 地理编码
function geocodePlace(placeName) {
    return new Promise((resolve) => {
        if (!geocoder) {
            resolve(null);
            return;
        }

        // 缩小搜索范围（当前校区周边0.005度，约500米）
        const bounds = new AMap.Bounds(
            [currentCampus.lng - 0.005, currentCampus.lat - 0.005],
            [currentCampus.lng + 0.005, currentCampus.lat + 0.005]
        );

        // 更精确的搜索关键词（包含校区+地点）
        const searchKeyword = `${currentCampus.name.split('（')[0]} ${placeName}`;

        geocoder.getLocation(searchKeyword, { bounds: bounds }, (status, result) => {
            if (status === 'complete' && result.geocodes.length > 0) {
                const location = result.geocodes[0].location;
                resolve({ lng: location.lng, lat: location.lat });
            } else {
                // 二次尝试：只搜索地点名称（防止关键词过于精确）
                geocoder.getLocation(placeName, { bounds: bounds }, (status2, result2) => {
                    if (status2 === 'complete' && result2.geocodes.length > 0) {
                        const location = result2.geocodes[0].location;
                        resolve({ lng: location.lng, lat: location.lat });
                    } else {
                        resolve(null);
                    }
                });
            }
        });
    });
}

// 绑定事件
function bindEvents() {
    // 校区切换下拉菜单
    DOM.campusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.campusDropdown.classList.toggle('show');
    });

    // 选择校区
    DOM.campusOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            switchCampus(
                option.dataset.campus,
                option.textContent,
                option.dataset.lng,
                option.dataset.lat
            );
            DOM.campusDropdown.classList.remove('show');
        });
    });

    // 点击空白处关闭下拉菜单
    document.addEventListener('click', () => {
        DOM.campusDropdown.classList.remove('show');
    });

    // 阻止下拉菜单内部冒泡
    DOM.campusDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // 移动端菜单
    DOM.menuToggle.addEventListener('click', () => {
        DOM.sidePanel.classList.toggle('show');
        DOM.overlay.classList.toggle('show');
    });

    DOM.overlay.addEventListener('click', () => {
        DOM.sidePanel.classList.remove('show');
        DOM.overlay.classList.remove('show');
    });

    // 交换起点终点
    DOM.swapBtn.addEventListener('click', () => {
        const tempValue = DOM.startPoint.value;
        const tempLng = DOM.startPoint.dataset.lng;
        const tempLat = DOM.startPoint.dataset.lat;

        DOM.startPoint.value = DOM.endPoint.value;
        DOM.startPoint.dataset.lng = DOM.endPoint.dataset.lng;
        DOM.startPoint.dataset.lat = DOM.endPoint.dataset.lat;

        DOM.endPoint.value = tempValue;
        DOM.endPoint.dataset.lng = tempLng;
        DOM.endPoint.dataset.lat = tempLat;
    });

    // 常用地点点击
    DOM.placeItems.forEach(item => {
        item.addEventListener('click', () => {
            const placeName = item.dataset.name;
            const placeLng = item.dataset.lng;
            const placeLat = item.dataset.lat;

            if (!DOM.startPoint.value) {
                DOM.startPoint.value = placeName;
                DOM.startPoint.dataset.lng = placeLng;
                DOM.startPoint.dataset.lat = placeLat;
            } else {
                DOM.endPoint.value = placeName;
                DOM.endPoint.dataset.lng = placeLng;
                DOM.endPoint.dataset.lat = placeLat;
            }
        });
    });

    // 规划路线表单提交
    DOM.routeForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const startName = DOM.startPoint.value.trim();
        const endName = DOM.endPoint.value.trim();
        let startLng = DOM.startPoint.dataset.lng;
        let startLat = DOM.startPoint.dataset.lat;
        let endLng = DOM.endPoint.dataset.lng;
        let endLat = DOM.endPoint.dataset.lat;

        if (!startName || !endName) {
            alert('请输入起点和终点！');
            return;
        }
        if (startName === endName) {
            alert('起点和终点不能相同！');
            return;
        }

        if (!startLng || !startLat || !endLng || !endLat) {
            DOM.planBtn.disabled = true;
            DOM.planBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 正在搜索...';

            const [startCoords, endCoords] = await Promise.all([
                geocodePlace(startName),
                geocodePlace(endName)
            ]);

            DOM.planBtn.disabled = false;
            DOM.planBtn.innerHTML = '<i class="fa fa-search"></i> 规划路线';

            if (!startCoords || !endCoords) {
                alert('未能找到指定地点，请尝试更具体的名称（如：主校区图书馆）！');
                return;
            }

            startLng = startCoords.lng;
            startLat = startCoords.lat;
            endLng = endCoords.lng;
            endLat = endCoords.lat;
        }

        planRoute(
            parseFloat(startLng),
            parseFloat(startLat),
            parseFloat(endLng),
            parseFloat(endLat),
            startName,
            endName
        );
    });

    // 关闭路线信息面板
    DOM.closeRouteInfo.addEventListener('click', () => {
        DOM.routeInfoPanel.classList.remove('show');
    });

    // 窗口大小变化
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            DOM.sidePanel.classList.remove('show');
            DOM.overlay.classList.remove('show');
        }
        if (map) map.resize();
    });
}

// 页面加载完成后初始化
window.addEventListener('load', initMap);