#include <iostream>
#include <fstream>
#include <string>
#include <cmath>
#include <vector>
#include <array>
#include <climits>
#include <map>

using namespace std;

using pixel = unsigned char;
using matrix = array<array<pixel, 28>, 28>;
using dataset = vector<matrix>;
using dist = unsigned long long int;

string data_path = "ETL_DATA/";
// string data_path = "standardized_data/";

struct prediction_item
{
    prediction_item() : label(-1), distance(ULLONG_MAX){};
    prediction_item(short a, dist b) : label(a), distance(b){};
    short label;
    dist distance;
};

void readFile(matrix &store, string path)
{
    ifstream file(path.c_str());
    if (file)
    {
        char a;
        unsigned int i(0);
        // Read header
        for (int j = 0; j <= 128; j++)
        {
            file.get(a);
        }

        // Read file
        do
        {
            int w = floor(i / 28);
            store[w][i % 28] = a;
            i++;
        } while (file.get(a));
        // if(i != 783){
        //     cout << i << "OK..." << endl;
        // }
    }
    else
    {
        cout << "Couldn't read file " << path << endl;
        throw runtime_error("Couldn't read file");
    }
}

void matrixFromString(matrix &m, string str)
{
    // cout << str << ' ' << str.size() << endl;
    int i = 0;
    for (int i = 0; i < str.size() - 1; i += 2)
    {
        // cout << i << endl;
        int j = i / 2;
        int w = floor(j / 28);
        string ss = "";
        ss += str[i];
        ss += str[i + 1];
        m[w][j % 28] = pixel(stoi(ss, nullptr, 16));
        // int(str[i]));
    }
}

dist euclidian_distance(const matrix &A, const matrix &B)
{
    if (A.size() != B.size())
    {
        throw runtime_error("Matrices doesn't have the same type");
    }
    dist k(0);
    for (int i = 0; i < A.size(); i++)
    {
        for (int j = 0; j < A[i].size(); j++)
        {
            k += sqrt(pow((A[i][j] - B[i][j]), 2));
        }
    }
    return k;
}

short choose_from_predictions(const vector<prediction_item> &list)
{
    dist max = list.back().distance;

    map<short, vector<dist>> s;
    for (prediction_item k : list)
    {
        s[k.label].push_back(max - k.distance);
        cerr << k.label << " : " << k.distance << endl;
    }

    map<short, dist> t;
    for (const auto &k : s)
    {
        dist g = 0;
        for (dist h : k.second)
        {
            g += h;
        }
        g /= list.size();
        t[k.first] += g;
    }

    short res = 0;

    for (const auto &k : t)
    {
        if (k.second > t[res])
        {
            res = k.first;
        }
    }
    // cout << res << endl;
    return res;
}

short predict(array<dataset, 119> train_sets, const matrix &matrix_to_test, unsigned short int neighbors)
{
    // cout << "Predicting... " << endl;
    vector<prediction_item> list(neighbors);

    for (short l = 0; l < train_sets.size(); l++)
    {
        for (const matrix &A : train_sets[l])
        {
            dist d = euclidian_distance(A, matrix_to_test);
            for (unsigned short int i = 0; i < neighbors; i++)
            {
                if (list[i].distance > d)
                {
                    prediction_item p(l, d);
                    list.insert(begin(list) + i, p);
                    list.pop_back();
                    break;
                }
            }
        }
    }

    return choose_from_predictions(list);
}

int main(int argc, char **argv)
{
    int neighbors = 5;
    if (argc > 1)
    {
        neighbors = stoi(argv[1]);
    }
    cout << "Starting" << endl;

    string labels[119] = {
        "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
        "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
        "K", "L", "M", "N", "ア", "イ", "ウ", "エ", "オ", "カ",
        "キ", "ク", "ケ", "コ", "サ", "シ", "ス", "セ", "ソ", "タ",
        "チ", "ツ", "テ", "ト", "ナ", "ニ", "ヌ", "ネ", "ノ", "ハ",
        "ヒ", "フ", "ヘ", "ホ", "マ", "ミ", "ム", "メ", "モ", "ヤ",
        "ユ", "ヨ", "ラ", "リ", "ル", "レ", "ロ", "ワ", "ヰ", "ヱ",
        "ヲ",
        "あ", "い", "う", "え", "お", "か",
        "き", "く", "け", "こ", "さ", "し",
        "す", "せ", "そ", "た", "ち", "つ",
        "て", "と", "な", "に", "ぬ", "ね",
        "の", "は", "ひ", "ふ", "へ", "ほ",
        "ま", "み", "む", "め", "も", "や",
        "ゆ", "よ", "ら", "り", "る", "れ",
        "ろ", "わ", "を", "ん"};

    int train_sizes[119] = {
        1422, 1443, 1444, 1444, 1444, 1444, 1444, 1444, 1444, 1444,
        1445, 1445, 1445, 1445, 1445, 1445, 1445, 1445, 1445, 1445,
        1445, 1444, 1445, 1444, 1411, 1411, 1411, 1411, 1411, 1411,
        1411, 1411, 1411, 1411, 1411, 1411, 1411, 1411, 1411, 1411,
        1411, 1411, 1411, 1411, 1410, 1411, 1411, 1411, 1411, 1411,
        1411, 1411, 1411, 1411, 1411, 1411, 1411, 1411, 1411, 1411,
        1411, 1411, 1411, 1409, 1410, 1410, 1410, 1410, 1410, 1410,
        1410, 200, 200, 200, 200, 200, 200,
        200, 200, 200, 200, 200, 200,
        200, 200, 200, 200, 200, 200,
        200, 200, 200, 200, 200, 200,
        200, 200, 200, 200, 200, 200,
        200, 200, 200, 200, 200, 200,
        200, 200, 200, 200, 200, 200,
        200, 200, 200, 200};
    array<dataset, 119> train;
    for (unsigned short i = 0; i < 119; i++)
    {
        for (int j = 0; j < train_sizes[i]; j++)
        {
            // cout << i << j << endl;
            matrix k;
            readFile(k, data_path + labels[i] + "/" + to_string(j) + ".npy");
            train[i].push_back(k);
        }
    }

    cout << "Ready" << endl;

    string str;
    getline(cin, str);
    matrix to_test;
    while (str != "end")
    {
        // cout << "Read"<< endl;
        matrixFromString(to_test, str);
        // cout << "Predicting" << endl;
        short result = predict(train, to_test, neighbors);
        cout << "Result : " << labels[result] << endl;
        getline(cin, str);
    }
    return 0;
}