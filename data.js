// 数据加载器 - 从detail.json加载语法数据
let grammarData = null;

// 加载数据
async function loadGrammarData() {
    try {
        const response = await fetch('detail.json');
        const data = await response.json();
        grammarData = data;
        return data;
    } catch (error) {
        console.error('加载数据失败:', error);
        return null;
    }
}

// 获取所有节点
function getAllNodes() {
    if (!grammarData || !grammarData.nodes) return [];
    return grammarData.nodes;
}

// 根据ID获取节点
function getNodeById(nodeId) {
    const nodes = getAllNodes();
    return nodes.find(node => node.nodeId === nodeId);
}

// 获取子节点
function getChildNodes(parentId) {
    const nodes = getAllNodes();
    return nodes.filter(node => node.parentId === parentId);
}

// 获取节点路径
function getNodePath(nodeId) {
    const path = [];
    let currentId = nodeId;
    
    while (currentId) {
        const node = getNodeById(currentId);
        if (node) {
            path.unshift(node);
            currentId = node.parentId;
        } else {
            break;
        }
    }
    
    return path;
}

// 获取节点层级
function getNodeLevel(nodeId) {
    const node = getNodeById(nodeId);
    return node ? node.level : -1;
}

// 搜索节点
function searchNodes(keyword) {
    const nodes = getAllNodes();
    const lowerKeyword = keyword.toLowerCase();
    
    return nodes.filter(node => {
        const nameMatch = node.nodeName.toLowerCase().includes(lowerKeyword);
        const defMatch = node.content && node.content.definition && 
                        node.content.definition.toLowerCase().includes(lowerKeyword);
        return nameMatch || defMatch;
    });
}

// 获取根节点
function getRootNode() {
    return getNodeById('root');
}

// 获取一级节点
function getLevel1Nodes() {
    return getChildNodes('root');
}

// 获取节点树结构
function getNodeTree(nodeId) {
    const node = getNodeById(nodeId);
    if (!node) return null;
    
    const children = getChildNodes(nodeId);
    const tree = {
        ...node,
        children: children.map(child => getNodeTree(child.nodeId))
    };
    
    return tree;
}

// 获取完整树结构
function getFullTree() {
    return getNodeTree('root');
}

// 获取元数据
function getMetadata() {
    return grammarData ? grammarData.metadata : null;
}

// 获取节点总数
function getTotalNodes() {
    return getAllNodes().length;
}

// 获取关键点节点
function getKeypointNodes() {
    return getAllNodes().filter(node => node.isKeyPoint);
}

// 获取有练习的节点
function getNodesWithExercises() {
    return getAllNodes().filter(node => 
        node.exercises && node.exercises.length > 0
    );
}

// 获取所有练习
function getAllExercises() {
    const exercises = [];
    getAllNodes().forEach(node => {
        if (node.exercises && node.exercises.length > 0) {
            node.exercises.forEach(ex => {
                exercises.push({
                    ...ex,
                    nodeId: node.nodeId,
                    nodeName: node.nodeName
                });
            });
        }
    });
    return exercises;
}

// 根据节点ID获取练习
function getExercisesByNodeId(nodeId) {
    const node = getNodeById(nodeId);
    if (!node || !node.exercises) return [];
    return node.exercises;
}

// 导出函数
window.GrammarData = {
    load: loadGrammarData,
    getAllNodes,
    getNodeById,
    getChildNodes,
    getNodePath,
    getNodeLevel,
    searchNodes,
    getRootNode,
    getLevel1Nodes,
    getNodeTree,
    getFullTree,
    getMetadata,
    getTotalNodes,
    getKeypointNodes,
    getNodesWithExercises,
    getAllExercises,
    getExercisesByNodeId
};
