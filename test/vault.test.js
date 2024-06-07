const { expect } = require("chai");
const {ethers} = require("hardhat");

describe("Vault", function () {
    let owner;
    let addr1
    let wethToken;
    let erc20Mock;
    let vault;

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();

        // deploy weth token contract
        const WETH = await ethers.getContractFactory("WETHMock");
        wethToken = await WETH.deploy();
        await wethToken.waitForDeployment();

        // deploy vault token contract
        const Vault = await ethers.getContractFactory("Vault");
        vault = await Vault.deploy(wethToken.target);
        await vault.waitForDeployment();

        // Deploy a mock ERC20 token
        const TokenContract = await ethers.getContractFactory("ERC20Mock");
        erc20Mock = await TokenContract.deploy("TestToken", "TTK", owner.address, ethers.parseEther("1000"));
        await erc20Mock.waitForDeployment();
    });

    describe("Deposit successfully", function () {
        it("Should deposit ETH correctly", async function () {
            const depositAmount = ethers.parseEther("1.0");
            await vault.connect(addr1).depositETH({ value: depositAmount });

            const balance = await vault.connect(addr1).getETHBalance();
            expect(balance).to.equal(depositAmount);
        });

        it("Should deposit ERC20 correctly", async function () {
            const depositAmount = ethers.parseEther("10");
            await erc20Mock.approve(vault.target, depositAmount);

            // deposit erc20 mock
            const balanceBefore = await erc20Mock.balanceOf(owner.address);
            await vault.connect(owner).depositERC20(erc20Mock.target, depositAmount);

            expect(await erc20Mock.balanceOf(owner.address)).to.equal(balanceBefore - depositAmount);
            expect(await vault.getAssetBalance(erc20Mock.target)).to.equal(depositAmount);
        });
    });

    describe("Withdraw successfully", function () {
        it("Should withdraw ETH correctly", async function () {
            const depositAmount = ethers.parseEther("1.0");
            await vault.connect(addr1).depositETH({ value: depositAmount });

            const balanceBefore = await ethers.provider.getBalance(addr1.address);
            await vault.connect(addr1).withdrawETH(depositAmount);

            // balance will increase but not exactly the deposit amount because of gas fee
            expect(await ethers.provider.getBalance(addr1.address)).to.gt(balanceBefore);
        });

        it("Should withdraw ERC20 correctly", async function () {
            const depositAmount = ethers.parseEther("10");
            await erc20Mock.approve(vault.target, depositAmount);

            // deposit erc20 mock
            await vault.connect(owner).depositERC20(erc20Mock.target, depositAmount);

            const balanceBefore = await erc20Mock.balanceOf(owner.address);
            await vault.connect(owner).withdrawERC20(erc20Mock.target, depositAmount);

            expect(await erc20Mock.balanceOf(owner.address)).to.equal(balanceBefore + depositAmount);
        });
    });

    describe("Wrap and Unwrap ETH to and from WETH", function () {
        it("Should wrap ETH to WETH correctly", async function () {
            const depositAmount = ethers.parseEther("10");
            await vault.connect(addr1).depositETH({ value: depositAmount });

            // weth balance before wrapping
            const balanceBefore = await vault.getAssetBalance(wethToken.target);
            const wrappedAmount = ethers.parseEther("2")
            await vault.connect(addr1).wrapETHToWETH(wrappedAmount);

            expect(await vault.connect(addr1).getAssetBalance(wethToken.target)).to.equal(balanceBefore + wrappedAmount);
            expect(await wethToken.balanceOf(vault.target)).to.equal(wrappedAmount);
        });


        // notice: Failing in hardhat node but passing in ganache
        it("Should unwrap WETH to ETH correctly", async function () {
            const depositAmount = ethers.parseEther("10");
            await vault.connect(addr1).depositETH({ value: depositAmount });

            const wrappedAmount = ethers.parseEther("2");
            await vault.connect(addr1).wrapETHToWETH(wrappedAmount);

            const ethBalanceBefore = await vault.getETHBalance();
            const wethBalanceBefore = await vault.getAssetBalance(wethToken.target);

            const unwrappedAmount = ethers.parseEther("1");
            await vault.connect(addr1).unwrapWETHToETH(unwrappedAmount);

            expect(await vault.getAssetBalance(wethToken.target)).to.equal(wethBalanceBefore - unwrappedAmount);
            expect(await vault.getETHBalance()).to.equal(ethBalanceBefore + unwrappedAmount);
        });
    });
});