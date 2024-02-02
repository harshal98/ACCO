import { AC } from "@debut/indicators";
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
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Timer from "./Timer";

let FuturePairs: string[] = [];

function Aco() {
  let [resetcd, setresetcd] = useState(0);
  let [Acodata, setAcodata] = useState<
    {
      pair: string;
      percentrank: number;
      acc15m: string;
      acc1h: string;
      acc4h: string;
    }[]
  >([]);

  function generateData() {
    getAllTimeKline().then((res) => {
      let temp1: {
        futurepair: string;
        acc15m: boolean;
        acc1h: boolean;
        acc4h: boolean;
        lastprice: number;
      }[] = [];
      let lastprice = 0;
      FuturePairs.forEach((futurepair) => {
        lastprice = Number(
          res.m15m.filter((i) => i.pair == futurepair)[0].kline[
            res.m15m.filter((i) => i.pair == futurepair)[0].kline.length - 1
          ].c
        );
        let acc15m = getAc(
          {
            pair: futurepair,
            kline: res.m15m.filter((i) => i.pair == futurepair)[0].kline,
          },
          "15m"
        );
        let acc1h = getAc(
          {
            pair: futurepair,
            kline: res.h1.filter((i) => i.pair == futurepair)[0].kline,
          },
          "1h"
        );
        let acc4h = getAc(
          {
            pair: futurepair,
            kline: res.h4.filter((i) => i.pair == futurepair)[0].kline,
          },
          "4h"
        );

        temp1.push({ futurepair, acc15m, acc1h, acc4h, lastprice });
      });
      console.log(temp1);

      let temp2 = temp1
        .map((i) => {
          let acc15m = i.acc15m ? "Yes" : "No";
          let acc1h = i.acc1h ? "Yes" : "No";
          let acc4h = i.acc4h ? "Yes" : "No";
          return { pair: i.futurepair, acc15m, acc4h, acc1h };
        })
        .filter(
          (i) => i.acc15m == "Yes" || i.acc1h == "Yes" || i.acc4h == "Yes"
        );

      get24hrpercent().then((res) => {
        let temp3 = temp2.map((i) => {
          return {
            ...i,
            percentrank: res.findIndex((r) => {
              return r.pair == i.pair;
            }),
          };
        });
        setAcodata(
          sortdata(sortdata(sortdata(temp3, "acc15m"), "acc1h"), "acc4h")
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
              <Th>DailyRank</Th>
              <Th>15m-Acc</Th>
              <Th>1h-Acc</Th>
              <Th>4h-Acc</Th>
            </Tr>
          </Thead>
          <Tbody>
            {Acodata.map((i, indx) => (
              <Tr key={indx}>
                <Td>{indx + 1}</Td>

                <Td>{i.pair}</Td>
                <Td>{i.percentrank}</Td>
                <Td>{i.acc15m}</Td>
                <Td>{i.acc1h}</Td>
                <Td>{i.acc4h}</Td>
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
    kline: { c: number; high: number; low: number }[];
  }[] = [];
  res.forEach((r: AxiosResponse) => {
    let pairUrl = String(r.request.responseURL);
    pairUrl = pairUrl.substring(pairUrl.lastIndexOf("=") + 1);
    let hc: { c: number; high: number; low: number }[] = [];

    r.data.forEach((i: any[]) =>
      hc.push({
        high: Number(i[1]),
        low: Number(i[2]),
        c: Number(i[4]),
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

function getACmax(aclist: number[]) {
  let lowaclist: { indx: number; val: number }[] = [];
  let highaclist: { indx: number; val: number }[] = [];

  for (let x = aclist.length - 1; x >= 0; x--) {
    if (aclist[x] < 0) {
      lowaclist.push({
        indx: x,
        val: aclist[x],
      });
    }
  }
  for (let x = aclist.length - 1; x >= 0; x--) {
    if (aclist[x] > 0) {
      highaclist.push({
        indx: x,

        val: aclist[x],
      });
    }
  }

  let acListMaxLows: { max: number }[] = [];
  if (lowaclist.length > 0) {
    let max = lowaclist[0].val;

    let lastindex = lowaclist[0].indx;
    for (let x = 1; x < lowaclist.length; x++) {
      if (lastindex == lowaclist[x].indx + 1) {
        if (max > lowaclist[x].val) {
          max = lowaclist[x].val;
        }
        lastindex--;
      } else {
        acListMaxLows.push({ max });
        lastindex = lowaclist[x].indx;
        max = lowaclist[x].val;
      }
      if (x == lowaclist.length - 1) acListMaxLows.push({ max });
    }
  }

  let acListMaxHighs: { max: number }[] = [];
  if (highaclist.length > 0) {
    let max = highaclist[0].val;

    let lastindex = highaclist[0].indx;
    for (let x = 1; x < highaclist.length; x++) {
      if (lastindex == highaclist[x].indx + 1) {
        if (max < highaclist[x].val) {
          max = highaclist[x].val;
        }
        lastindex--;
      } else {
        acListMaxHighs.push({ max });
        lastindex = highaclist[x].indx;
        max = highaclist[x].val;
      }
      if (x == highaclist.length - 1) acListMaxHighs.push({ max });
    }
  }
  let lastmax = 0;

  if (aclist[aclist.length - 1] > 0) {
    lastmax = acListMaxHighs[0].max;
    acListMaxHighs = acListMaxHighs.slice(1, acListMaxHighs.length);
  } else {
    lastmax = acListMaxLows[0].max;
    acListMaxLows = acListMaxLows.slice(1, acListMaxLows.length);
  }
  return {
    high: acListMaxHighs.slice(0, 2),
    low: acListMaxLows.slice(0, 2),
    lastmax,
  };
}

function getAc(
  item: { pair: string; kline: { high: number; low: number }[] },
  _timeframe: string
) {
  let ac = new AC();
  let aclist: number[] = [];
  item.kline.forEach((i) => {
    let val = ac.nextValue(i.high, i.low);
    if (val) {
      aclist.push(val);
    }
  });
  let result = getACmax(aclist);
  if (result.high.length > 0 && result.low.length > 0) {
    let countH = 0;
    let prev = result.high[0].max;
    result.high.forEach((i) => {
      if (i.max > prev) countH++;
      prev = i.max;
    });
    let countL = 0;
    prev = result.low[0].max;
    result.low.forEach((i) => {
      if (i.max < prev) countL++;
      prev = i.max;
    });
    console.log(
      item.pair,
      _timeframe,
      result,
      result.lastmax > result.low[0].max
    );

    if (countL > 0 && result.lastmax > result.low[0].max) return true;
  }
  return false;
}
function sortdata(
  t: {
    pair: string;
    percentrank: number;
    acc15m: string;
    acc1h: string;
    acc4h: string;
  }[],
  sortby: string
) {
  return t.sort((i: any, j: any) => {
    if (i[sortby] > j[sortby]) return -1;
    else return 1;
  });
}
export default Aco;
