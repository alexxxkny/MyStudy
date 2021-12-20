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
            node.querySelector('.node__lesson').innerText = node_data['lesson']
            node.querySelector('.node__type').innerText = node_data['type']
            node.querySelector('.node__room').innerText = node_data['room']
            node.style.backgroundColor = '#' + table[column][row]['color']
        }
    }
}

function clearTable(table_nodes_elements) {
    for (let node of table_nodes_elements){
        clearNode(node)
    }
}

function clearNode(node) {
    node.style.backgroundColor = 'white'
    node.children[0].innerText = 'Предмет'
    node.children[1].innerText = 'Вид занятия'
    node.children[2].innerText = 'Аудитория'
    node.removeAttribute('data-id')
}

export {makeTableNodes, fillTable, clearTable, clearNode}