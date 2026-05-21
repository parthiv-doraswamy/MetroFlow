#ifndef GRAPH_H
#define GRAPH_H

#include <iostream>
#include <vector>
#include <unordered_map>
#include <queue>
#include <string>
#include <climits>
#include <algorithm>
#include <functional>

using namespace std;

class Graph {

private:

    unordered_map<
        string,
        vector< pair<string, int> >
    > adj;

public:

    void addEdge(
        const string& u,
        const string& v,
        int w
    ) {

        adj[u].push_back(
            make_pair(v, w)
        );

        adj[v].push_back(
            make_pair(u, w)
        );
    }

    unordered_map<
        string,
        vector< pair<string, int> >
    >& getGraph() {

        return adj;
    }
};

#endif