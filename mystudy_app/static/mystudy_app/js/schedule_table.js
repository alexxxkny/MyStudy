function makeTableNodes(table_nodes_elements) {
    // Making a matrix of nodes like a table
    const column_count = 6
    const row_count = table_nodes_elements.length / 6
    let table_nodes = []
    for(let i = 0; i < row_count; i++) {
        table_nodes.push(table_nodes_elements.slice(i * column_count, i * column_count + column_count))
    }
    return table_nodes
}

function fillTable(table, table_nodes) {
    console.log(table)
    for(let column of Object.keys(table)){
        for(let row of Object.keys(table[column])) {
            let node = table_nodes[row][column]
            let node_data = table[column][row]
            node.setAttribute('data-id', node_data['id'])
            node.setAttribute('data-status', node_data['status'])

            if(node_data['status'] === 'custom-canceled'){
                fillNode(node, node_data)
                const status_block = createStatusElement('Отменена')
                node.insertAdjacentElement('afterbegin', status_block)
            } else {
                node.querySelector('.node__lesson').innerText = node_data['lesson']
                node.querySelector('.node__type').innerText = node_data['type']
                node.querySelector('.node__room').innerText = node_data['room']
                node.style.backgroundColor = '#' + table[column][row]['color']
            }
        }
    }
}

function flushTable(table_nodes_elements) {
    for (let node of table_nodes_elements){
        flushNode(node)
    }
}

function flushNode(node) {
    node.style.backgroundColor = 'white'
    node.children[0].innerText = 'Предмет'
    node.children[1].innerText = 'Вид занятия'
    node.children[2].innerText = 'Аудитория'
    node.removeAttribute('data-id')
}

function clearTable(table_nodes_elements) {
    for (let node of table_nodes_elements){
        clearNode(node)
    }
}

function clearNode(node) {
    node.style.backgroundColor = 'white'
    node.children[0].innerText = ''
    node.children[1].innerText = ''
    node.children[2].innerText = ''
    node.removeAttribute('data-id')
}

function fillNode(node, data){
    node.children[0].innerText = data['discipline']
    node.children[1].innerText = data['type']
    node.children[2].innerText = data['room']
    node.style.backgroundColor = '#' + data['color']
}

function createStatusElement(text) {
    let status_block = document.createElement('div')
    let status_text = document.createElement('p')
    status_block.classList.add('node__status')
    status_text.innerText = text
    status_block.insertAdjacentElement('beforeend', status_text)
    return status_block
}

export {makeTableNodes, fillTable, clearTable, clearNode, flushTable, flushNode, fillNode,
    createStatusElement}