import { BollingerBands, SuperTrend } from "@debut/indicators";
import axios, { AxiosResponse } from "axios";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
  HStack,
  Button,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Timer from "./Timer";

let FuturePairs: string[] = [];

function Aco() {
  //let [data, setdata] = useState<Klinedata>([]);
  let [resetcd, setresetcd] = useState(0);
  let [Acodata, setAcodata] = useState<
    {
      pair: string;
      percentrank: number;
      ST15m: string;
      ST1h: string;
      ST4h: string;
      percentagechange15m: number;
    }[]
  >([]);

  function generateData() {
    getAllTimeKline().then((res) => {
      let temp1: {
        futurepair: string;
        ST15mArray: {
          value: number;
        }[];
        ST1hArray: {
          value: number;
        }[];
        ST4hArray: {
          value: number;
        }[];
        lastprice: number;
        h24_2hr: boolean;
        percentagechange15m: number;
      }[] = [];
      let lastprice = 0;
      FuturePairs.forEach((futurepair) => {
        lastprice = Number(
          res.m15m.filter((i) => i.pair == futurepair)[0].kline[
            res.m15m.filter((i) => i.pair == futurepair)[0].kline.length - 1
          ].c
        );
        let ST15mArray = getST(
          res.m15m.filter((i) => i.pair == futurepair)[0].kline
        );
        let ST1hArray = getST(
          res.h1.filter((i) => i.pair == futurepair)[0].kline
        );
        let ST4hArray = getST(
          res.h4.filter((i) => i.pair == futurepair)[0].kline
        );
        let kline1h = res.h1.filter((i) => i.pair == futurepair)[0].kline;

        let max = 0;
        kline1h.slice(kline1h.length - 25, kline1h.length - 23).forEach((i) => {
          if (max < i.c) max = i.c;
        });

        //console.log(max, futurepair);

        let percentagechange15m =
          Number(
            res.m15m.filter((i) => i.pair == futurepair)[0].kline[
              res.m15m.filter((i) => i.pair == futurepair)[0].kline.length - 1
            ].c
          ) /
          Number(
            res.m15m.filter((i) => i.pair == futurepair)[0].kline[
              res.m15m.filter((i) => i.pair == futurepair)[0].kline.length - 2
            ].c
          );
        // console.log(
        //   Number(
        //     res.m15m.filter((i) => i.pair == futurepair)[0].kline[
        //       res.m15m.filter((i) => i.pair == futurepair)[0].kline.length - 1
        //     ].c
        //   ),
        //   Number(
        //     res.m15m.filter((i) => i.pair == futurepair)[0].kline[
        //       res.m15m.filter((i) => i.pair == futurepair)[0].kline.length - 2
        //     ].c
        //   ),
        //   futurepair

        // );
        let bb1d = getBB1d(res.d1.filter((i) => i.pair == futurepair)[0].kline);

        //console.log(bb1d, futurepair);

        if (bb1d == undefined ? true : bb1d.middle < lastprice)
          //max < kline1h[kline1h.length - 1].c)
          temp1.push({
            futurepair,
            ST15mArray,
            ST1hArray,
            ST4hArray,
            lastprice,
            h24_2hr: max < lastprice * 1.01,
            percentagechange15m,
          });
      });

      let temp2 = temp1
        .map((i) => {
          let ST15m =
            //middif15m > 0 ||
            i.ST15mArray.length > 0
              ? i.ST15mArray[i.ST15mArray.length - 1].value == -1
                ? "Yes"
                : "No"
              : "Yes";
          let ST1h =
            i.ST1hArray.length > 0
              ? i.ST1hArray[i.ST1hArray.length - 1].value == -1
                ? "Yes"
                : "No"
              : "Yes";
          let ST4h =
            i.ST4hArray.length > 0
              ? i.ST4hArray[i.ST4hArray.length - 1].value == -1
                ? "Yes"
                : "No"
              : "Yes";
          i.percentagechange15m;
          return {
            pair: i.futurepair,
            ST15m,
            ST1h,
            ST4h,
            percentagechange15m: (i.percentagechange15m - 1) * 100,
          };
        })
        .filter(
          (i) =>
            (i.ST15m == "Yes" && i.ST1h == "Yes") ||
            (i.ST1h == "Yes" && i.ST4h == "Yes") ||
            (i.ST15m == "Yes" && i.ST4h == "Yes")
        );
      get24hrpercent().then((res) => {
        setAcodata(
          temp2
            .map((i) => {
              return {
                ...i,
                percentrank: res.findIndex((r) => {
                  return r.pair == i.pair;
                }),
              };
            })
            .sort((i, j) => {
              if (i.percentrank > j.percentrank) return 1;
              else return -1;
            })
        );
      });
    });
  }

  useEffect(() => {
    generateData();
    let t = setInterval(() => {
      generateData(), setresetcd((r) => r + 1);
    }, 30000);
    return () => clearInterval(t);
  }, []);

  // useEffect(() => {
  //   console.log(Acodata);
  // });

  async function get24hrpercent() {
    let temp: {
      pair: string;
      priceChangePercent: number;
    }[] = [];
    await axios
      .get(
        `https://api.binance.com/api/v3/ticker/24hr?symbols=[${FuturePairs.map(
          (i) => `"${i}"`
        )}]`
      )
      .then((res) => {
        temp = res.data.map((i: any) => {
          return {
            pair: i.symbol,
            priceChangePercent: Number(i.priceChangePercent),
          };
        });
        temp.sort((i: any, j: any) => {
          if (i.priceChangePercent > j.priceChangePercent) return -1;
          else if (i.priceChangePercent < j.priceChangePercent) return 1;
          return 0;
        });
      });
    return temp;
  }

  return (
    <>
      <HStack>
        <Timer count={resetcd}></Timer>
      </HStack>
      <TableContainer>
        <Table variant="striped" colorScheme="teal" size="lg">
          <TableCaption>Accelerator Oscillator</TableCaption>
          <Thead>
            <Tr>
              <Th>Index</Th>
              <Th>Pair</Th>
              <Th>15M%</Th>
              <Th>DailyRank</Th>
              <Th>ST15m</Th>
              <Th>ST1h</Th>
              <Th>ST4h</Th>
            </Tr>
          </Thead>
          <Tbody>
            {Acodata.map((i, indx) => (
              <Tr key={indx}>
                <Td>{indx + 1}</Td>

                <Td>{i.pair}</Td>

                <Td>
                  {i.percentagechange15m > 0 ? (
                    <Button colorScheme="purple">
                      {i.percentagechange15m.toPrecision(2)}
                    </Button>
                  ) : (
                    i.percentagechange15m.toPrecision(2)
                  )}
                </Td>
                <Td>{i.percentrank}</Td>
                <Td>
                  {i.ST15m == "Yes" ? (
                    <Button colorScheme="purple">{i.ST15m}</Button>
                  ) : (
                    i.ST15m
                  )}
                </Td>
                <Td>
                  {i.ST1h == "Yes" ? (
                    <Button colorScheme="purple">{i.ST1h}</Button>
                  ) : (
                    i.ST1h
                  )}
                </Td>
                <Td>
                  {i.ST4h == "Yes" ? (
                    <Button colorScheme="purple">{i.ST4h}</Button>
                  ) : (
                    i.ST4h
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
}

async function getKlineData(time: string) {
  let promisarray: any[] = [];
  await axios
    .get(
      "https://raw.githubusercontent.com/harshal98/Pairs/main/FuturePairs.js"
    )
    .then((res) => (FuturePairs = res.data));

  FuturePairs.forEach((item) => {
    promisarray.push(
      axios.get(
        `https://api.binance.com/api/v3/klines?interval=${time}&limit=100&symbol=${item}`
      )
    );
  });
  let res = await axios.all(promisarray);
  let temp: { pair: string; kline: { c: number; l: number; h: number }[] }[] =
    [];
  res.forEach((r: AxiosResponse) => {
    let pairUrl = String(r.request.responseURL);
    pairUrl = pairUrl.substring(pairUrl.lastIndexOf("=") + 1);
    let hc: { c: number; l: number; h: number }[] = [];

    r.data.forEach((i: any[]) =>
      hc.push({
        c: Number(i[4]),
        h: Number(i[2]),
        l: Number(i[3]),
      })
    );
    temp.push({ pair: pairUrl, kline: hc });
  });

  return temp;
}

async function getAllTimeKline() {
  let m15m = await getKlineData("15m");
  let h1 = await getKlineData("1h");
  let h4 = await getKlineData("4h");
  let d1 = await getKlineData("1d");

  return { m15m, h1, h4, d1 };
}

function getST(klinedata: { c: number; l: number; h: number }[]) {
  let ST = new SuperTrend(20, 2);
  let STarray: {
    value: number;
  }[] = [];
  klinedata.forEach((kline) => {
    let val = ST.nextValue(kline.h, kline.l, kline.c);
    if (val) {
      STarray.push({ value: val.direction });
    }
  });
  return STarray;
}

function getBB1d(kline: { c: number; l: number; h: number }[]) {
  let bb = new BollingerBands();
  let bbarray = [];
  for (let x of kline) {
    let val = bb.nextValue(x.c);
    if (val) bbarray.push(val);
  }
  return bbarray.pop();
}
export default Aco;
