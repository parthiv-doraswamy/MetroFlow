const stations = [
  "A","B","C","D","E",
  "F","G","H","I","J",
  "K","L","M","N","O",
  "P","Q","R","S","T",
  "U","V","W","X","Y"
];

const edges = [

  ["A","B",4],
  ["A","C",2],
  ["B","D",5],
  ["C","D",8],
  ["C","E",10],
  ["D","F",6],
  ["E","F",3],
  ["F","G",1],
  ["G","H",2],
  ["H","I",4],
  ["I","J",6],
  ["J","K",5],
  ["K","L",3],
  ["L","M",7],
  ["M","N",4],
  ["N","O",2],
  ["O","P",5],
  ["P","Q",6],
  ["Q","R",4],
  ["R","S",3],
  ["S","T",2],
  ["T","U",7],
  ["U","V",5],
  ["V","W",4],
  ["W","X",6],
  ["X","Y",2],

  ["D","H",5],
  ["G","L",8],
  ["K","P",7],
  ["M","T",9],
  ["B","G",6],
  ["E","J",7],
  ["P","U",5]
];

/* GRAPH */

const graph = {};

stations.forEach((station) => {
  graph[station] = [];
});

edges.forEach(([u,v,w]) => {

  graph[u].push({
    node:v,
    weight:w
  });

  graph[v].push({
    node:u,
    weight:w
  });
});

/* DROPDOWNS */

const sourceSelect =
document.getElementById("source");

const destinationSelect =
document.getElementById("destination");

stations.forEach((station) => {

  const option1 =
  document.createElement("option");

  option1.value = station;
  option1.textContent = station;

  sourceSelect.appendChild(option1);

  const option2 =
  document.createElement("option");

  option2.value = station;
  option2.textContent = station;

  destinationSelect.appendChild(option2);
});

/* VIS NETWORK */

const nodes = new vis.DataSet(

  stations.map((station) => ({

    id:station,
    label:station,

    color:{
      background:"#38bdf8",
      border:"#0ea5e9"
    },

    font:{
      color:"#ffffff",
      size:16
    },

    size:22
  }))
);

const visEdges = new vis.DataSet(

  edges.map(([u,v,w]) => ({

    from:u,
    to:v,

    label:String(w),

    color:{
      color:"#475569"
    },

    font:{
      color:"#cbd5e1",
      size:14
    },

    width:2
  }))
);

const container =
document.getElementById("network");

const data = {
  nodes:nodes,
  edges:visEdges
};

const options = {

  physics:{
    enabled:true,
    stabilization:true
  },

  interaction:{
    hover:true
  },

  nodes:{
    shape:"dot"
  },

  edges:{
    smooth:{
      type:"dynamic"
    }
  }
};

const network =
new vis.Network(
  container,
  data,
  options
);

/* RESET */

function resetGraph(){

  nodes.forEach((node) => {

    nodes.update({

      id:node.id,

      color:{
        background:"#38bdf8",
        border:"#0ea5e9"
      }
    });
  });

  visEdges.forEach((edge) => {

    visEdges.update({

      id:edge.id,

      color:{
        color:"#475569"
      },

      width:2
    });
  });
}

/* FIND PATH */

document
.getElementById("findPathBtn")
.addEventListener("click", async () => {

  resetGraph();

  const source =
  sourceSelect.value;

  const destination =
  destinationSelect.value;

  if(source === destination){

    alert(
      "Source and destination cannot be same."
    );

    return;
  }

  try{

    const response =
    await fetch(

      "http://localhost:3000/route",

      {

        method:"POST",

        headers:{
          "Content-Type":"application/json"
        },

        body:JSON.stringify({
          source,
          destination
        })
      }
    );

    const result =
    await response.json();

    document
    .getElementById("pathText")
    .textContent =
    result.path.join(" → ");

    document
    .getElementById("distanceText")
    .textContent =
    result.distance + " km";

    document
    .getElementById("timeText")
    .textContent =
    (result.distance * 2)
    + " mins";

    result.path.forEach((node) => {

      nodes.update({

        id:node,

        color:{
          background:"#22c55e",
          border:"#16a34a"
        }
      });
    });

    for(
      let i=0;
      i<result.path.length-1;
      i++
    ){

      const a = result.path[i];

      const b = result.path[i+1];

      visEdges.forEach((edge) => {

        if(

          (
            edge.from === a &&
            edge.to === b
          )

          ||

          (
            edge.from === b &&
            edge.to === a
          )
        ){

          visEdges.update({

            id:edge.id,

            color:{
              color:"#22c55e"
            },

            width:5
          });
        }
      });
    }

  }catch(error){

    console.error(error);

    alert(
      "Backend connection failed."
    );
  }
});

/* BFS */

function bfs(start){

  const queue = [start];

  const visited = new Set();

  const order = [];

  visited.add(start);

  while(queue.length > 0){

    const current = queue.shift();

    order.push(current);

    graph[current].forEach((neighbor) => {

      if(!visited.has(neighbor.node)){

        visited.add(neighbor.node);

        queue.push(neighbor.node);
      }
    });
  }

  return order;
}

/* BFS VISUALIZATION */

document
.getElementById("bfsBtn")
.addEventListener("click",() => {

  resetGraph();

  const source =
  sourceSelect.value;

  const order =
  bfs(source);

  order.forEach((node,index) => {

    setTimeout(() => {

      nodes.update({

        id:node,

        color:{
          background:"#f59e0b",
          border:"#d97706"
        }
      });

    },index * 350);
  });
});