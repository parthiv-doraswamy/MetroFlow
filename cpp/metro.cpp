#include "graph.h"

int main(
    int argc,
    char* argv[]
) {

    if (argc < 3) {

        return 1;
    }

    string source =
        argv[1];

    string destination =
        argv[2];

    Graph metro;

    /* METRO GRAPH */

    metro.addEdge("A","B",4);
    metro.addEdge("A","C",2);
    metro.addEdge("B","D",5);
    metro.addEdge("C","D",8);
    metro.addEdge("C","E",10);
    metro.addEdge("D","F",6);
    metro.addEdge("E","F",3);
    metro.addEdge("F","G",1);
    metro.addEdge("G","H",2);
    metro.addEdge("H","I",4);
    metro.addEdge("I","J",6);
    metro.addEdge("J","K",5);
    metro.addEdge("K","L",3);
    metro.addEdge("L","M",7);
    metro.addEdge("M","N",4);
    metro.addEdge("N","O",2);
    metro.addEdge("O","P",5);
    metro.addEdge("P","Q",6);
    metro.addEdge("Q","R",4);
    metro.addEdge("R","S",3);
    metro.addEdge("S","T",2);
    metro.addEdge("T","U",7);
    metro.addEdge("U","V",5);
    metro.addEdge("V","W",4);
    metro.addEdge("W","X",6);
    metro.addEdge("X","Y",2);

    metro.addEdge("D","H",5);
    metro.addEdge("G","L",8);
    metro.addEdge("K","P",7);
    metro.addEdge("M","T",9);
    metro.addEdge("B","G",6);
    metro.addEdge("E","J",7);
    metro.addEdge("P","U",5);

    unordered_map<
        string,
        vector< pair<string, int> >
    >& graph = metro.getGraph();

    unordered_map<string, int> dist;

    unordered_map<string, string>
    parent;

    priority_queue<

        pair<int, string>,

        vector< pair<int, string> >,

        greater< pair<int, string> >

    > pq;

    unordered_map<
        string,
        vector< pair<string, int> >
    >::iterator nodeIterator;

    for (
        nodeIterator = graph.begin();
        nodeIterator != graph.end();
        ++nodeIterator
    ) {

        dist[nodeIterator->first]
        = INT_MAX;
    }

    dist[source] = 0;

    pq.push(
        make_pair(0, source)
    );

    while (!pq.empty()) {

        pair<int, string> current =
            pq.top();

        pq.pop();

        int currentDist =
            current.first;

        string currentNode =
            current.second;

        vector< pair<string, int> >
        neighbors =
            graph[currentNode];

        for (
            size_t i = 0;
            i < neighbors.size();
            i++
        ) {

            string nextNode =
                neighbors[i].first;

            int weight =
                neighbors[i].second;

            if (

                currentDist + weight

                < dist[nextNode]

            ) {

                dist[nextNode]
                = currentDist + weight;

                parent[nextNode]
                = currentNode;

                pq.push(

                    make_pair(
                        dist[nextNode],
                        nextNode
                    )
                );
            }
        }
    }

    vector<string> path;

    string current =
        destination;

    while (
        current != source
    ) {

        path.push_back(current);

        current =
            parent[current];
    }

    path.push_back(source);

    reverse(
        path.begin(),
        path.end()
    );

    /* JSON OUTPUT */

    cout << "{";

    cout
    << "\"distance\":"
    << dist[destination]
    << ",";

    cout << "\"path\":[";

    for (
        size_t i = 0;
        i < path.size();
        i++
    ) {

        cout
        << "\""
        << path[i]
        << "\"";

        if (
            i != path.size() - 1
        ) {

            cout << ",";
        }
    }

    cout << "]}";

    return 0;
}