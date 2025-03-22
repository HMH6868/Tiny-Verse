function printLogo(){
    const rainbow = ['red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'white'];
    const text = 'Tool viết bởi HMH';
    const coloredText = text.split('').map((char, i) => 
    char === ' ' ? ' ' : `${char}`[rainbow[i % rainbow.length]]
    ).join('');
    console.log(coloredText);
};

module.exports = printLogo;