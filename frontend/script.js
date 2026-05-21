sourceSelect.value = "A";
destinationSelect.value = "T";

/* ROUTE */

document
.getElementById("findPathBtn")
.addEventListener("click", async () => {

  resetGraph();

  const button =
  document.getElementById(
    "findPathBtn"
  );

  button.textContent =
  "Finding Route...";

  const source =
  sourceSelect.value;

  const destination =
  destinationSelect.value;

  if(source === destination){

    alert(
      "Source and destination cannot be same."
    );

    button.textContent =
    "Find Shortest Path";

    return;
  }

  try{

    const response =
    await fetch(

      "http://localhost:3000/route",

      {

        method:"POST",

        headers:{
          "Content-Type":
          "application/json"
        },

        body:JSON.stringify({
          source,
          destination
        })
      }
    );

    const result =
    await response.json();

    if(result.error){

      alert(result.error);

      return;
    }

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

    function calculateFare(distance){

      if(distance <= 10){
        return 20;
      }

      if(distance <= 25){
        return 35;
      }

      return 50;
    }

    const fare =
    calculateFare(
      result.distance
    );

    document
    .getElementById("fareText")
    .textContent =
    "₹" + fare;

    const transfers =
    Math.max(
      result.path.length - 2,
      0
    );

    document
    .getElementById("transferText")
    .textContent =
    transfers;

    document
    .getElementById("timeStampText")
    .textContent =
    new Date()
    .toLocaleTimeString();

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

      const a =
      result.path[i];

      const b =
      result.path[i+1];

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

    button.textContent =
    "Find Shortest Path";

  }catch(error){

    console.error(error);

    button.textContent =
    "Find Shortest Path";

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

    const current =
    queue.shift();

    order.push(current);

    graph[current].forEach((neighbor) => {

      if(!visited.has(neighbor.node)){

        visited.add(
          neighbor.node
        );

        queue.push(
          neighbor.node
        );
      }
    });
  }

  return order;
}

/* NEARBY STATIONS */

document
.getElementById("bfsBtn")
.addEventListener("click",() => {

  resetGraph();

  const source =
  sourceSelect.value;

  const order =
  bfs(source);

  document
  .getElementById("nearbyText")
  .textContent =
  order.slice(1,6).join(", ");

  order.forEach((node,index) => {

    setTimeout(() => {

      nodes.update({

        id:node,

        color:{
          background:"#f59e0b",
          border:"#d97706"
        }
      });

    },index * 300);
  });
});

/* BACKEND STATUS */

async function checkBackend(){

  try{

    const response =
    await fetch(
      "http://localhost:3000"
    );

    const data =
    await response.json();

    document
    .getElementById("serverStatus")
    .textContent =
    data.status;

  }catch{

    document
    .getElementById("serverStatus")
    .textContent =
    "Backend Offline";

    document
    .getElementById("serverStatus")
    .style.color =
    "#ef4444";
  }
}

checkBackend();