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
  Select,
  HStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Timer from "./Timer";

type Klinedata = {
  pair: string;
  kline: { high: number; low: number; close: number }[];
}[];
function Aco() {
  let FuturePairs: string[] = [];
  //let [data, setdata] = useState<Klinedata>([]);
  let [resetcd, setresetcd] = useState(0);
  let [Acodata, setAcodata] = useState<{ pair: string; percentrank: number }[]>(
    []
  );
  let [timeframe, setTimeframe] = useState("15m");
  function generateData() {
    let temp: Klinedata = [];
    let data1: string[] = [];
    getKlineData(timeframe)
      .then((res: any[]) =>
        res.forEach((r: AxiosResponse) => {
          let pairUrl = String(r.request.responseURL);
          pairUrl = pairUrl.substring(pairUrl.lastIndexOf("=") + 1);
          let hc: { high: number; low: number; close: number }[] = [];

          r.data.forEach((i: any[]) =>
            hc.push({
              high: Number(i[2]),
              low: Number(i[3]),
              close: Number(i[4]),
            })
          );
          temp.push({ pair: pairUrl, kline: hc });
        })
      )
      .then(() => {
        temp.forEach((item) => {
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
            let h24status = true;
            let start = timeframe == "15m" ? 95 : timeframe == "1h" ? 23 : 0;
            let end =
              timeframe == "15m" ? 95 - 4 * 2 : timeframe == "1h" ? 21 : 0;
            let statusarray = item.kline.slice(
              item.kline.length - 1 - start,
              item.kline.length - 1 - end
            );
            let lastprice = item.kline[item.kline.length - 1].close;
            statusarray.forEach((i) => {
              if (lastprice < i.close * 0.99) h24status = false;
            });

            if (countH > 0 && countL > 0 && h24status) {
              data1.push(item.pair);
            }
          }
        });
        get24hrpercent().then((r) => {
          setAcodata(
            data1
              .map((item) => {
                return {
                  pair: item,
                  percentrank: r.findIndex((i) => i.pair == item) + 1,
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

    if (aclist[aclist.length - 1] > 0) {
      acListMaxHighs = acListMaxHighs.slice(1, acListMaxHighs.length);
    } else {
      acListMaxLows = acListMaxLows.slice(1, acListMaxLows.length);
    }
    return { high: acListMaxHighs.slice(0, 2), low: acListMaxLows.slice(0, 2) };
  }

  useEffect(() => {
    generateData();
    let t = setInterval(() => {
      generateData(), setresetcd((r) => r + 1);
    }, 30000);
    return () => clearInterval(t);
  }, [timeframe]);

  // useEffect(() => {
  //   console.log(Acodata);
  // });

  async function get24hrpercent() {
    let temp: any[] = [];
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
  async function getKlineData(time: string) {
    await axios
      .get(
        "https://raw.githubusercontent.com/harshal98/Pairs/main/FuturePairs.js"
      )
      .then((res) => (FuturePairs = res.data));
    let promisarray: any[] = [];
    FuturePairs.forEach((item) => {
      promisarray.push(
        axios.get(
          `https://api.binance.com/api/v3/klines?interval=${time}&limit=100&symbol=${item}`
        )
      );
    });
    return axios.all(promisarray);
  }

  return (
    <>
      <HStack>
        <Timer count={resetcd}></Timer>
        <Select
          defaultValue={"15m"}
          onChange={(e) => {
            //console.log(e.target.value);
            setTimeframe(e.target.value);
            setresetcd((r) => r + 1);
          }}
        >
          <option value="15m">15 Minute</option>
          <option value="1h">1 Hour</option>
          <option value="4h">4 Hour</option>
        </Select>
      </HStack>
      <TableContainer>
        <Table variant="striped" colorScheme="teal" size="lg">
          <TableCaption>Accelerator Oscillator</TableCaption>
          <Thead>
            <Tr>
              <Th>Index</Th>
              <Th>Pair</Th>
              <Th>DailyRank</Th>
            </Tr>
          </Thead>
          <Tbody>
            {Acodata.map((i, indx) => (
              <Tr key={indx}>
                <Td>{indx + 1}</Td>

                <Td>{i.pair}</Td>
                <Td>{i.percentrank}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
}

export default Aco;
