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
        kline15m: {
          c: number;
          l: number;
          h: number;
          v: number;
        }[];
        kline1h: {
          c: number;
          l: number;
          h: number;
          v: number;
        }[];
        kline4h: {
          c: number;
          l: number;
          h: number;
          v: number;
        }[];
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

        let kline15m = res.m15m.filter((i) => i.pair == futurepair)[0].kline;
        let kline1h = res.h1.filter((i) => i.pair == futurepair)[0].kline;
        let kline4h = res.h4.filter((i) => i.pair == futurepair)[0].kline;
        let ST15mArray = getST(kline15m);
        let ST1hArray = getST(kline1h);
        let ST4hArray = getST(kline4h);

        let max = 0;
        kline1h.slice(kline1h.length - 25, kline1h.length - 23).forEach((i) => {
          if (max < i.c) max = i.c;
        });

        let vma: { val: number; vol: number }[] = [];

        let sum = 0;
        kline15m
          .slice(kline15m.length - 29, kline15m.length - 4)
          .forEach((i) => (sum = sum + i.v)),
          vma.push({ val: sum / 25, vol: kline15m[kline15m.length - 5].v });
        sum = 0;

        kline15m
          .slice(kline15m.length - 28, kline15m.length - 3)
          .forEach((i) => (sum = sum + i.v)),
          vma.push({ val: sum / 25, vol: kline15m[kline15m.length - 4].v });
        sum = 0;

        kline15m
          .slice(kline15m.length - 27, kline15m.length - 2)
          .forEach((i) => (sum = sum + i.v)),
          vma.push({ val: sum / 25, vol: kline15m[kline15m.length - 3].v });
        sum = 0;

        kline15m
          .slice(kline15m.length - 26, kline15m.length - 1)
          .forEach((i) => (sum = sum + i.v)),
          vma.push({ val: sum / 25, vol: kline15m[kline15m.length - 2].v });
        sum = 0;

        kline15m
          .slice(kline15m.length - 25, kline15m.length)
          .forEach((i) => (sum = sum + i.v)),
          vma.push({ val: sum / 25, vol: kline15m[kline15m.length - 1].v });

        // let volcond = false;

        // vma.forEach((i) => {
        //   if (i.vol > 2 * i.val) volcond = true;
        // });

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
        if (max < kline1h[kline1h.length - 1].c /*&& volcond*/)
          temp1.push({
            futurepair,
            ST15mArray,
            ST1hArray,
            ST4hArray,
            lastprice,
            h24_2hr: max < lastprice * 1.01,
            percentagechange15m,
            kline15m,
            kline1h,
            kline4h,
          });
      });

      let temp2 = temp1
        .map((i) => {
          let ST15m =
            //middif15m > 0 ||
            i.ST15mArray.length > 0
              ? i.ST15mArray[i.ST15mArray.length - 1].value == -1 &&
                BB(i.kline15m)
                ? "Yes"
                : "No"
              : "Yes";
          let ST1h =
            i.ST1hArray.length > 0
              ? i.ST1hArray[i.ST1hArray.length - 1].value == -1 && BB(i.kline1h)
                ? "Yes"
                : "No"
              : "Yes";
          let ST4h =
            i.ST4hArray.length > 0
              ? i.ST4hArray[i.ST4hArray.length - 1].value == -1 //&& BB(i.kline4h)
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
  let temp: {
    pair: string;
    kline: { c: number; l: number; h: number; v: number }[];
  }[] = [];
  res.forEach((r: AxiosResponse) => {
    let pairUrl = String(r.request.responseURL);
    pairUrl = pairUrl.substring(pairUrl.lastIndexOf("=") + 1);
    let hc: { c: number; l: number; h: number; v: number }[] = [];

    r.data.forEach((i: any[]) =>
      hc.push({
        c: Number(i[4]),
        h: Number(i[2]),
        l: Number(i[3]),
        v: Number(i[5]),
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

  return { m15m, h1, h4 };
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

function BB(klinedata: { c: number; l: number; h: number }[]) {
  let BB = new BollingerBands();
  let BBarray: {
    BBpercent: number;
    cprice: number;
    BBval: {
      lower: number;
      middle: number;
      upper: number;
    };
  }[] = [];
  klinedata.forEach((kline) => {
    let val = BB.nextValue(kline.c);
    if (val) {
      BBarray.push({
        BBpercent: (kline.c - val.lower) / (val.upper - val.lower),
        cprice: kline.c,
        BBval: val,
      });
    }
  });

  return StandardDeviation(BBarray);

  function StandardDeviation(
    arr: {
      BBpercent: number;
      cprice: number;
      BBval: {
        lower: number;
        middle: number;
        upper: number;
      };
    }[]
  ) {
    let candles = 16;
    arr = arr.slice(arr.length - candles, arr.length);
    // Creating the mean with Array.reduce
    function calBBsumdiff(arr: number[]) {
      let sumlast5 = 0;
      let sumnext5 = 0;
      //let prev = 0;
      arr.slice(0, candles / 2 + 1).forEach((i) => (sumnext5 = +i));
      arr.slice(candles / 2 + 1, candles).forEach((i) => (sumlast5 = +i));
      return sumnext5 - sumlast5;
    }

    return (
      calBBsumdiff(arr.map((i) => i.BBval.upper)) > 0 &&
      calBBsumdiff(arr.map((i) => i.BBval.lower)) < 0
    );
  }
}
export default Aco;
