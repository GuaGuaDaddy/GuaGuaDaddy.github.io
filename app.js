// 主应用逻辑
class EnglishGrammarApp {
    constructor() {
        // 状态
        this.currentNode = null;
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.expandedNodes = new Set(['root', '1', '2', '3', '4', '5', '6']);
        this.nodePositions = new Map();
        
        // DOM元素
        this.mindmapCanvas = document.getElementById('mindmapCanvas');
        this.detailPanel = document.getElementById('detailPanel');
        this.modalOverlay = document.getElementById('modalOverlay');
        this.modal = document.getElementById('modal');
        
        // 初始化
        this.init();
    }
    
    async init() {
        // 加载数据
        await GrammarData.load();
        
        // 初始化用户数据
        this.initUserData();
        
        // 渲染思维导图
        this.renderMindmap();
        
        // 绑定事件
        this.bindEvents();
        
        // 更新进度
        this.updateProgress();
    }
    
    // 初始化用户数据
    initUserData() {
        this.userData = this.loadUserData();
        if (!this.userData) {
            this.userData = {
                learnedNodes: [],
                notes: {},
                mistakes: [],
                lastVisit: null,
                streakDays: 0,
                totalDays: 0
            };
            this.saveUserData();
        }
        
        // 更新连续学习天数
        this.updateStreak();
    }
    
    // 加载用户数据
    loadUserData() {
        const data = localStorage.getItem('englishGrammarUserData');
        return data ? JSON.parse(data) : null;
    }
    
    // 保存用户数据
    saveUserData() {
        localStorage.setItem('englishGrammarUserData', JSON.stringify(this.userData));
    }
    
    // 更新连续学习天数
    updateStreak() {
        const today = new Date().toDateString();
        const lastVisit = this.userData.lastVisit;
        
        if (lastVisit) {
            const lastDate = new Date(lastVisit);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastDate.toDateString() === yesterday.toDateString()) {
                this.userData.streakDays++;
            } else if (lastDate.toDateString() !== today) {
                this.userData.streakDays = 1;
            }
        } else {
            this.userData.streakDays = 1;
        }
        
        this.userData.lastVisit = today;
        this.saveUserData();
    }
    
    // 渲染思维导图
    renderMindmap() {
        const root = GrammarData.getFullTree();
        if (!root) return;
        
        this.mindmapCanvas.innerHTML = '';
        
        // 创建SVG层用于绘制连接线
        const svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgLayer.classList.add('mindmap-svg');
        svgLayer.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;';
        this.mindmapCanvas.appendChild(svgLayer);
        
        // 计算布局
        this.calculateLayout(root, 0, 0);
        
        // 渲染节点
        this.renderNodes(root, svgLayer);
        
        // 应用变换
        this.applyTransform();
    }
    
    // 计算布局
    calculateLayout(node, x, y, depth = 0) {
        const nodeWidth = this.getNodeWidth(node);
        const nodeHeight = 40;
        const horizontalGap = 200;
        const verticalGap = 20;
        
        // 存储位置
        this.nodePositions.set(node.nodeId, { x, y, width: nodeWidth, height: nodeHeight });
        
        if (this.expandedNodes.has(node.nodeId) && node.children && node.children.length > 0) {
            // 计算子节点总高度
            let totalHeight = 0;
            node.children.forEach(child => {
                const childHeight = this.getSubtreeHeight(child);
                totalHeight += childHeight;
            });
            totalHeight += (node.children.length - 1) * verticalGap;
            
            // 子节点起始位置
            let currentY = y - totalHeight / 2;
            const childX = x + horizontalGap;
            
            node.children.forEach(child => {
                const childHeight = this.getSubtreeHeight(child);
                const childY = currentY + childHeight / 2;
                this.calculateLayout(child, childX, childY, depth + 1);
                currentY += childHeight + verticalGap;
            });
        }
    }
    
    // 获取节点宽度
    getNodeWidth(node) {
        const text = this.getNodeDisplayName(node);
        return Math.max(80, text.length * 14 + 32);
    }
    
    // 获取子树高度
    getSubtreeHeight(node) {
        if (!this.expandedNodes.has(node.nodeId) || !node.children || node.children.length === 0) {
            return 50;
        }
        
        let height = 0;
        node.children.forEach(child => {
            height += this.getSubtreeHeight(child);
        });
        height += (node.children.length - 1) * 20;
        return Math.max(50, height);
    }
    
    // 获取节点显示名称
    getNodeDisplayName(node) {
        return node.nodeName.replace(/<br>/g, ' ').replace(/·/g, '·');
    }
    
    // 渲染节点
    renderNodes(node, svgLayer) {
        const pos = this.nodePositions.get(node.nodeId);
        if (!pos) return;
        
        // 创建节点元素
        const nodeEl = document.createElement('div');
        nodeEl.className = 'mind-node';
        nodeEl.dataset.nodeId = node.nodeId;
        nodeEl.style.cssText = `left: ${pos.x - pos.width/2}px; top: ${pos.y - pos.height/2}px;`;
        
        const content = document.createElement('div');
        content.className = `node-content level-${node.level}`;
        
        // 添加特殊样式
        if (node.isKeyPoint) content.classList.add('keypoint');
        if (this.userData.learnedNodes.includes(node.nodeId)) content.classList.add('learned');
        if (this.hasMistakes(node.nodeId)) content.classList.add('has-mistake');
        if (this.currentNode && this.currentNode.nodeId === node.nodeId) content.classList.add('active');
        
        content.innerHTML = this.getNodeDisplayName(node);
        nodeEl.appendChild(content);
        
        // 添加折叠按钮
        if (node.children && node.children.length > 0) {
            const collapseBtn = document.createElement('button');
            collapseBtn.className = 'collapse-btn';
            collapseBtn.textContent = this.expandedNodes.has(node.nodeId) ? '−' : '+';
            collapseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNode(node.nodeId);
            });
            content.appendChild(collapseBtn);
        }
        
        // 点击事件
        nodeEl.addEventListener('click', () => this.selectNode(node.nodeId));
        
        this.mindmapCanvas.appendChild(nodeEl);
        
        // 渲染子节点和连接线
        if (this.expandedNodes.has(node.nodeId) && node.children) {
            node.children.forEach(child => {
                this.renderNodes(child, svgLayer);
                this.renderConnection(node.nodeId, child.nodeId, svgLayer);
            });
        }
    }
    
    // 渲染连接线
    renderConnection(parentId, childId, svgLayer) {
        const parentPos = this.nodePositions.get(parentId);
        const childPos = this.nodePositions.get(childId);
        
        if (!parentPos || !childPos) return;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        const startX = parentPos.x + parentPos.width / 2;
        const startY = parentPos.y;
        const endX = childPos.x - childPos.width / 2;
        const endY = childPos.y;
        
        const midX = (startX + endX) / 2;
        
        const d = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
        
        path.setAttribute('d', d);
        path.classList.add('mind-line');
        svgLayer.appendChild(path);
    }
    
    // 切换节点展开/折叠
    toggleNode(nodeId) {
        if (this.expandedNodes.has(nodeId)) {
            this.expandedNodes.delete(nodeId);
        } else {
            this.expandedNodes.add(nodeId);
        }
        this.renderMindmap();
    }
    
    // 选择节点
    selectNode(nodeId) {
        const node = GrammarData.getNodeById(nodeId);
        if (!node) return;
        
        this.currentNode = node;
        this.renderDetailPanel(node);
        this.renderMindmap();
        
        // 移动端显示面板
        if (window.innerWidth <= 768) {
            this.detailPanel.classList.add('active');
        }
    }
    
    // 渲染详情面板
    renderDetailPanel(node) {
        const template = document.getElementById('detailTemplate');
        const content = template.content.cloneNode(true);
        
        // 填充内容
        content.querySelector('.node-title').textContent = node.nodeName.replace(/<br>/g, ' ');
        
        // 徽章
        const badges = content.querySelector('.node-badges');
        if (node.isKeyPoint) {
            badges.innerHTML += '<span class="badge keypoint">⭐ 重难点</span>';
        }
        if (this.userData.learnedNodes.includes(node.nodeId)) {
            badges.innerHTML += '<span class="badge learned">✓ 已学习</span>';
        }
        
        // 定义
        const defContent = content.querySelector('.definition-content');
        if (node.content && node.content.definition) {
            defContent.textContent = node.content.definition;
        } else {
            defContent.parentElement.style.display = 'none';
        }
        
        // 规则
        const rulesList = content.querySelector('.rules-list');
        if (node.content && node.content.rules && node.content.rules.length > 0) {
            node.content.rules.forEach(rule => {
                const li = document.createElement('li');
                li.textContent = rule;
                rulesList.appendChild(li);
            });
        } else {
            rulesList.parentElement.style.display = 'none';
        }
        
        // 例句
        const examplesContent = content.querySelector('.examples-content');
        if (node.content && node.content.examples && Object.keys(node.content.examples).length > 0) {
            Object.entries(node.content.examples).forEach(([key, examples]) => {
                const group = document.createElement('div');
                group.className = 'example-group';
                
                const title = document.createElement('div');
                title.className = 'example-group-title';
                title.textContent = key;
                group.appendChild(title);
                
                if (Array.isArray(examples)) {
                    examples.forEach(ex => {
                        const item = document.createElement('div');
                        item.className = 'example-item';
                        item.textContent = ex;
                        group.appendChild(item);
                    });
                }
                
                examplesContent.appendChild(group);
            });
        } else {
            examplesContent.parentElement.style.display = 'none';
        }
        
        // 易错点
        const mistakesList = content.querySelector('.mistakes-list');
        if (node.content && node.content.commonMistakes && node.content.commonMistakes.length > 0) {
            node.content.commonMistakes.forEach(mistake => {
                const li = document.createElement('li');
                li.textContent = mistake;
                mistakesList.appendChild(li);
            });
        } else {
            mistakesList.parentElement.style.display = 'none';
        }
        
        // 关联节点
        const relatedNodes = content.querySelector('.related-nodes');
        if (node.content && node.content.relatedNodes && node.content.relatedNodes.length > 0) {
            node.content.relatedNodes.forEach(relId => {
                const relNode = GrammarData.getNodeById(relId);
                if (relNode) {
                    const btn = document.createElement('button');
                    btn.className = 'related-node';
                    btn.textContent = relNode.nodeName.replace(/<br>/g, ' ');
                    btn.addEventListener('click', () => this.selectNode(relId));
                    relatedNodes.appendChild(btn);
                }
            });
        } else {
            relatedNodes.parentElement.style.display = 'none';
        }
        
        // 练习按钮
        const practiceBtn = content.getElementById('startPractice');
        const exercises = GrammarData.getExercisesByNodeId(node.nodeId);
        if (exercises.length === 0) {
            practiceBtn.style.display = 'none';
        } else {
            practiceBtn.addEventListener('click', () => this.startPractice(node));
        }
        
        // 笔记按钮
        content.getElementById('addNote').addEventListener('click', () => this.showNoteInput(node.nodeId));
        
        // 标记按钮
        const markBtn = content.getElementById('markLearned');
        if (this.userData.learnedNodes.includes(node.nodeId)) {
            markBtn.textContent = '✓ 已学习';
            markBtn.classList.add('learned');
        }
        markBtn.addEventListener('click', () => this.toggleLearned(node.nodeId));
        
        // 关闭按钮
        content.querySelector('.btn-close').addEventListener('click', () => this.closeDetailPanel());
        
        // 渲染
        this.detailPanel.innerHTML = '';
        this.detailPanel.appendChild(content);
    }
    
    // 关闭详情面板
    closeDetailPanel() {
        this.currentNode = null;
        this.detailPanel.innerHTML = `
            <div class="panel-placeholder">
                <div class="placeholder-icon">👆</div>
                <p>点击思维导图中的节点<br>开始学习</p>
            </div>
        `;
        this.renderMindmap();
        
        if (window.innerWidth <= 768) {
            this.detailPanel.classList.remove('active');
        }
    }
    
    // 开始练习
    startPractice(node) {
        const exercises = GrammarData.getExercisesByNodeId(node.nodeId);
        if (exercises.length === 0) return;
        
        this.currentPractice = {
            node: node,
            exercises: exercises,
            currentIndex: 0,
            answers: [],
            submitted: false
        };
        
        this.renderPracticePanel();
    }
    
    // 渲染练习面板
    renderPracticePanel() {
        const { node, exercises, currentIndex } = this.currentPractice;
        const exercise = exercises[currentIndex];
        
        const template = document.getElementById('practiceTemplate');
        const content = template.content.cloneNode(true);
        
        content.querySelector('.practice-title').textContent = node.nodeName.replace(/<br>/g, ' ');
        content.querySelector('.current-q').textContent = currentIndex + 1;
        content.querySelector('.total-q').textContent = exercises.length;
        content.querySelector('.question-text').textContent = exercise.question;
        
        // 渲染选项
        const optionsContainer = content.querySelector('.options-container');
        
        if (exercise.type === 'singleChoice') {
            exercise.options.forEach((option, index) => {
                const optionEl = document.createElement('div');
                optionEl.className = 'option-item';
                optionEl.dataset.index = index;
                optionEl.innerHTML = `
                    <span class="option-label">${String.fromCharCode(65 + index)}</span>
                    <span class="option-text">${option}</span>
                `;
                optionEl.addEventListener('click', () => this.selectOption(index));
                optionsContainer.appendChild(optionEl);
            });
        } else if (exercise.type === 'fillBlank') {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'fill-blank-input';
            input.placeholder = '填写答案';
            input.addEventListener('input', (e) => {
                this.currentPractice.answers[currentIndex] = e.target.value;
            });
            if (this.currentPractice.answers[currentIndex]) {
                input.value = this.currentPractice.answers[currentIndex];
            }
            optionsContainer.appendChild(input);
        } else if (exercise.type === 'errorCorrection') {
            const textarea = document.createElement('textarea');
            textarea.className = 'fill-blank-input';
            textarea.style.width = '100%';
            textarea.style.minHeight = '80px';
            textarea.placeholder = '请写出正确句子';
            textarea.addEventListener('input', (e) => {
                this.currentPractice.answers[currentIndex] = e.target.value;
            });
            if (this.currentPractice.answers[currentIndex]) {
                textarea.value = this.currentPractice.answers[currentIndex];
            }
            optionsContainer.appendChild(textarea);
        }
        
        // 按钮状态
        const prevBtn = content.querySelector('.btn-prev');
        const nextBtn = content.querySelector('.btn-next');
        const submitBtn = content.querySelector('.btn-submit');
        
        prevBtn.disabled = currentIndex === 0;
        
        if (currentIndex === exercises.length - 1) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'inline-block';
        } else {
            nextBtn.style.display = 'inline-block';
            submitBtn.style.display = 'none';
        }
        
        // 按钮事件
        prevBtn.addEventListener('click', () => this.prevQuestion());
        nextBtn.addEventListener('click', () => this.nextQuestion());
        submitBtn.addEventListener('click', () => this.submitPractice());
        content.querySelector('.btn-close').addEventListener('click', () => this.closePractice());
        
        // 渲染
        this.detailPanel.innerHTML = '';
        this.detailPanel.appendChild(content);
    }
    
    // 选择选项
    selectOption(index) {
        const options = this.detailPanel.querySelectorAll('.option-item');
        options.forEach((opt, i) => {
            opt.classList.toggle('selected', i === index);
        });
        this.currentPractice.answers[this.currentPractice.currentIndex] = index;
    }
    
    // 上一题
    prevQuestion() {
        if (this.currentPractice.currentIndex > 0) {
            this.currentPractice.currentIndex--;
            this.renderPracticePanel();
        }
    }
    
    // 下一题
    nextQuestion() {
        if (this.currentPractice.currentIndex < this.currentPractice.exercises.length - 1) {
            this.currentPractice.currentIndex++;
            this.renderPracticePanel();
        }
    }
    
    // 提交练习
    submitPractice() {
        const { exercises, answers } = this.currentPractice;
        let correct = 0;
        
        exercises.forEach((ex, index) => {
            const userAnswer = answers[index];
            let isCorrect = false;
            
            if (ex.type === 'singleChoice') {
                isCorrect = ex.options[userAnswer] === ex.answer;
            } else {
                isCorrect = userAnswer && userAnswer.toLowerCase().trim() === ex.answer.toLowerCase().trim();
            }
            
            if (isCorrect) {
                correct++;
            } else {
                // 记录错题
                this.addMistake(this.currentPractice.node.nodeId, ex);
            }
        });
        
        // 显示结果
        this.showPracticeResult(correct, exercises.length);
    }
    
    // 显示练习结果
    showPracticeResult(correct, total) {
        const resultHtml = `
            <div class="practice-result">
                <div class="result-score">
                    <span class="score">${correct}</span>/<span class="total">${total}</span>
                </div>
                <p class="result-message">${correct === total ? '🎉 完美！全部正确！' : correct >= total / 2 ? '👍 不错，继续加油！' : '💪 还需努力，多复习！'}</p>
                <div class="result-actions">
                    <button class="btn-retry" onclick="app.retryPractice()">重新练习</button>
                    <button class="btn-back" onclick="app.closePractice()">返回学习</button>
                </div>
            </div>
        `;
        
        this.detailPanel.innerHTML = resultHtml;
    }
    
    // 重试练习
    retryPractice() {
        this.currentPractice.currentIndex = 0;
        this.currentPractice.answers = [];
        this.renderPracticePanel();
    }
    
    // 关闭练习
    closePractice() {
        if (this.currentNode) {
            this.renderDetailPanel(this.currentNode);
        } else {
            this.closeDetailPanel();
        }
    }
    
    // 添加错题
    addMistake(nodeId, exercise) {
        const mistake = {
            nodeId: nodeId,
            exercise: exercise,
            timestamp: new Date().toISOString()
        };
        this.userData.mistakes.push(mistake);
        this.saveUserData();
    }
    
    // 检查是否有错题
    hasMistakes(nodeId) {
        return this.userData.mistakes.some(m => m.nodeId === nodeId);
    }
    
    // 显示笔记输入
    showNoteInput(nodeId) {
        const template = document.getElementById('noteInputTemplate');
        const content = template.content.cloneNode(true);
        
        const textarea = content.getElementById('noteContent');
        const existingNote = this.userData.notes[nodeId];
        if (existingNote) {
            textarea.value = existingNote;
        }
        
        content.querySelector('.btn-cancel').addEventListener('click', () => this.closeModal());
        content.querySelector('.btn-save').addEventListener('click', () => {
            this.saveNote(nodeId, textarea.value);
            this.closeModal();
        });
        
        this.showModal('添加笔记', content);
    }
    
    // 保存笔记
    saveNote(nodeId, note) {
        if (note.trim()) {
            this.userData.notes[nodeId] = note;
        } else {
            delete this.userData.notes[nodeId];
        }
        this.saveUserData();
    }
    
    // 切换学习状态
    toggleLearned(nodeId) {
        const index = this.userData.learnedNodes.indexOf(nodeId);
        if (index > -1) {
            this.userData.learnedNodes.splice(index, 1);
        } else {
            this.userData.learnedNodes.push(nodeId);
        }
        this.saveUserData();
        this.updateProgress();
        
        if (this.currentNode && this.currentNode.nodeId === nodeId) {
            this.renderDetailPanel(this.currentNode);
        }
        this.renderMindmap();
    }
    
    // 更新进度
    updateProgress() {
        const total = GrammarData.getTotalNodes() - 1; // 排除root
        const learned = this.userData.learnedNodes.length;
        const percentage = Math.round((learned / total) * 100);
        
        document.getElementById('progressFill').style.width = `${percentage}%`;
        document.getElementById('progressText').textContent = `${percentage}%`;
    }
    
    // 显示模态框
    showModal(title, content) {
        this.modal.querySelector('.modal-title').textContent = title;
        this.modal.querySelector('.modal-body').innerHTML = '';
        this.modal.querySelector('.modal-body').appendChild(content);
        this.modalOverlay.classList.add('active');
    }
    
    // 关闭模态框
    closeModal() {
        this.modalOverlay.classList.remove('active');
    }
    
    // 显示错题本
    showMistakes() {
        const template = document.getElementById('mistakesModalTemplate');
        const content = template.content.cloneNode(true);
        
        const list = content.getElementById('mistakesList');
        
        if (this.userData.mistakes.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: var(--text-muted);">暂无错题</p>';
        } else {
            this.userData.mistakes.forEach((mistake, index) => {
                const node = GrammarData.getNodeById(mistake.nodeId);
                const item = document.createElement('div');
                item.className = 'mistake-item';
                item.innerHTML = `
                    <div class="item-header">
                        <span class="item-title">${node ? node.nodeName.replace(/<br>/g, ' ') : '未知节点'}</span>
                        <span class="item-date">${new Date(mistake.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div class="item-content">${mistake.exercise.question}</div>
                `;
                item.addEventListener('click', () => {
                    this.closeModal();
                    if (node) this.selectNode(node.nodeId);
                });
                list.appendChild(item);
            });
        }
        
        this.showModal('📝 错题本', content);
    }
    
    // 显示笔记列表
    showNotes() {
        const template = document.getElementById('notesModalTemplate');
        const content = template.content.cloneNode(true);
        
        const list = content.getElementById('notesList');
        const notes = this.userData.notes;
        
        if (Object.keys(notes).length === 0) {
            list.innerHTML = '<p style="text-align: center; color: var(--text-muted);">暂无笔记</p>';
        } else {
            Object.entries(notes).forEach(([nodeId, note]) => {
                const node = GrammarData.getNodeById(nodeId);
                const item = document.createElement('div');
                item.className = 'note-item';
                item.innerHTML = `
                    <div class="item-header">
                        <span class="item-title">${node ? node.nodeName.replace(/<br>/g, ' ') : '未知节点'}</span>
                    </div>
                    <div class="item-content">${note}</div>
                `;
                item.addEventListener('click', () => {
                    this.closeModal();
                    if (node) this.selectNode(node.nodeId);
                });
                list.appendChild(item);
            });
        }
        
        this.showModal('📓 我的笔记', content);
    }
    
    // 显示学习计划
    showPlan() {
        const template = document.getElementById('planModalTemplate');
        const content = template.content.cloneNode(true);
        
        // 统计
        content.getElementById('totalLearned').textContent = this.userData.learnedNodes.length;
        content.getElementById('totalNodes').textContent = GrammarData.getTotalNodes() - 1;
        content.getElementById('streakDays').textContent = this.userData.streakDays;
        
        // 日历
        const calendar = content.getElementById('planCalendar');
        const calendarGrid = document.createElement('div');
        calendarGrid.className = 'calendar-grid';
        
        // 显示最近30天
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const day = document.createElement('div');
            day.className = 'calendar-day';
            day.textContent = date.getDate();
            if (i === 0) day.classList.add('today');
            // 这里可以根据实际学习记录标记
            calendarGrid.appendChild(day);
        }
        calendar.appendChild(calendarGrid);
        
        // 今日任务
        const todayTasks = content.getElementById('todayTasks');
        const unlearned = GrammarData.getAllNodes()
            .filter(n => n.nodeId !== 'root' && !this.userData.learnedNodes.includes(n.nodeId))
            .slice(0, 3);
        
        unlearned.forEach(node => {
            const task = document.createElement('div');
            task.className = 'task-item';
            task.textContent = node.nodeName.replace(/<br>/g, ' ');
            task.addEventListener('click', () => {
                this.closeModal();
                this.selectNode(node.nodeId);
            });
            todayTasks.appendChild(task);
        });
        
        this.showModal('📅 学习计划', content);
    }
    
    // 搜索
    search(keyword) {
        if (!keyword.trim()) return;
        
        const results = GrammarData.searchNodes(keyword);
        
        const template = document.getElementById('searchResultsTemplate');
        const content = template.content.cloneNode(true);
        
        const list = content.getElementById('resultsList');
        
        if (results.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: var(--text-muted);">未找到相关内容</p>';
        } else {
            results.slice(0, 10).forEach(node => {
                const item = document.createElement('div');
                item.className = 'result-item';
                
                const path = GrammarData.getNodePath(node.nodeId)
                    .map(n => n.nodeName.replace(/<br>/g, ' '))
                    .join(' > ');
                
                item.innerHTML = `
                    <div>
                        <div>${node.nodeName.replace(/<br>/g, ' ')}</div>
                        <div class="result-path">${path}</div>
                    </div>
                `;
                item.addEventListener('click', () => {
                    this.closeModal();
                    this.selectNode(node.nodeId);
                });
                list.appendChild(item);
            });
        }
        
        this.showModal(`🔍 搜索结果: "${keyword}"`, content);
    }
    
    // 绑定事件
    bindEvents() {
        // 缩放控制
        document.getElementById('zoomIn').addEventListener('click', () => {
            this.zoom = Math.min(2, this.zoom + 0.1);
            this.applyTransform();
        });
        
        document.getElementById('zoomOut').addEventListener('click', () => {
            this.zoom = Math.max(0.3, this.zoom - 0.1);
            this.applyTransform();
        });
        
        document.getElementById('zoomReset').addEventListener('click', () => {
            this.zoom = 1;
            this.panX = 0;
            this.panY = 0;
            this.applyTransform();
        });
        
        // 拖拽
        this.mindmapCanvas.addEventListener('mousedown', (e) => {
            if (e.target === this.mindmapCanvas || e.target.tagName === 'svg') {
                this.isDragging = true;
                this.dragStartX = e.clientX - this.panX;
                this.dragStartY = e.clientY - this.panY;
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.panX = e.clientX - this.dragStartX;
                this.panY = e.clientY - this.dragStartY;
                this.applyTransform();
            }
        });
        
        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        // 滚轮缩放
        this.mindmapCanvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            this.zoom = Math.max(0.3, Math.min(2, this.zoom + delta));
            this.applyTransform();
        });
        
        // 顶部按钮
        document.getElementById('mistakesBtn').addEventListener('click', () => this.showMistakes());
        document.getElementById('notesBtn').addEventListener('click', () => this.showNotes());
        document.getElementById('planBtn').addEventListener('click', () => this.showPlan());
        
        // 搜索
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        searchBtn.addEventListener('click', () => this.search(searchInput.value));
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.search(searchInput.value);
        });
        
        // 模态框关闭
        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) this.closeModal();
        });
    }
    
    // 应用变换
    applyTransform() {
        this.mindmapCanvas.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    }
}

// 初始化应用
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new EnglishGrammarApp();
});
