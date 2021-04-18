Matter.use('matter-attractors');

const M = {
    init() {
        this.Engine = Matter.Engine
        this.Render = Matter.Render
        this.Runner = Matter.Runner
        this.Bodies = Matter.Bodies
        this.Composites = Matter.Composites,
        this.Events = Matter.Events
        this.Bounds = Matter.Bounds
        this.World = Matter.World
        this.Body = Matter.Body
        this.Mouse = Matter.Mouse
        this.Common = Matter.Common
        this.MouseConstraint = Matter.MouseConstraint
        this.Constraint = Matter.Constraint
        this.scrollPosition = 0
        this.explosionForece = 0
        this.tool = 'mouse'
    },

    start () {
        // create an engine
        this.engineWorld = this.Engine.create();
        // this.engineWorld.world.gravity.scale = 0;

        this.screenWidth = $('body').width()
        this.screenHeight = $('body').height()

        // create a renderer
        let render = this.Render.create({
            element: document.body,
            engine: this.engineWorld,
            options: {
                width: this.screenWidth,
                height: this.screenHeight,
                background: 'transparent',
                wireframes: false,
                pixelRatio: 1,
                showAxes: false,
            }
        });

        this.createWalls($('body'))

        //Crate Boundries bades on section tags
        this.sectionWalls()

        //Explosion
        // create a body with an attractor
        this.attractiveBody = this.Bodies.circle(
            render.options.width / 2,
            render.options.height / 2,
            10, 
            {
            isStatic: true,
            collisionFilter: {
                mask: 2
            },
            render: { opacity: 0 },

            // example of an attractor function that 
            // returns a force vector that applies to bodyB
            plugin: {
                attractors: [
                    (bodyA, bodyB) => {
                        return {
                            x:  (20 * this.explosionForece) / (bodyA.position.x - bodyB.position.x),
                            y:  (20 * this.explosionForece) / (bodyA.position.y - bodyB.position.y),
                        };
                    }
                ]
            }
        });

        this.World.add(this.engineWorld.world, this.attractiveBody);

        // run the renderer
        this.Render.run(render);

        // create runner
        let runner = this.Runner.create();

        // run the engine
        this.Runner.run(runner, this.engineWorld);

        //Custom Render
        this.Events.on(this.engineWorld, 'afterUpdate', this.elementPosition);

        const mouse = this.Mouse.create(render.canvas);
        const mouseConstraint = this.MouseConstraint.create(this.engineWorld, {
            mouse,
            constraint: {
                angularStiffness: 0,
                render: {
                    visible: false
                }
            }
        });

        this.World.add(this.engineWorld.world, mouseConstraint);

        render.mouse = mouse;
    }, 

    addBox(position = {top: 200, left: 200}, size = [80, 80], $e = undefined) {
        const box = this.Bodies.rectangle(
            position.left + size[0]/2, 
            position.top + size[1]/2, 
            size[0], 
            size[1],
            {
                $e,
                mass: 5,
                render: { opacity: 0 }
            }
        )

        $e.data('body', box)
        this.World.add(this.engineWorld.world, box)
    },

    addCircle(position = {top: 200, left: 200}, size = 80, $e = undefined) {
        const circle = this.Bodies.circle(
            position.left + size/2, 
            position.top + size/2, 
            size,
            {
                $e,
                mass: 5,
                render: { opacity: 0 }
            },
            3
        )

        $e.data('body', circle)
        this.World.add(this.engineWorld.world, circle)
    },

    sectionWalls() {
        $('section').each((_, e) => {
             //TODO Make walls invisible
            this.createWalls($(e))
        })
    },

    createWalls($e) {
        const position = $e.position()
        const width = $e.outerWidth(true)
        const height = $e.outerHeight(true)
        const wallWidth = 20

        let wl = this.Bodies.rectangle(
            position.left - (wallWidth / 2), position.top + (height/2), 
            wallWidth, height, 
            { isStatic: true, render: { opacity: 0 } }
        )

        let wr = this.Bodies.rectangle(
            width + position.left + (wallWidth / 2), position.top + (height/2), 
            wallWidth, height, 
            { isStatic: true, render: { opacity: 0 } }
        )

        let wt = this.Bodies.rectangle(
            position.left + (width/2), position.top - (wallWidth / 2), 
            width, wallWidth, 
            { isStatic: true, render: { opacity: 0 } }
        )

        let wb = this.Bodies.rectangle(
            position.left + (width/2), height + position.top + (wallWidth / 2), 
            width, wallWidth, 
            { isStatic: true, render: { opacity: 0 } }
        )

        this.World.add(this.engineWorld.world, [wl, wt, wb, wr]);
    },

    boom(position) {
        this.Body.translate(this.attractiveBody, {
            x: (position.x - this.attractiveBody.position.x),
            y: (position.y - this.attractiveBody.position.y)
        });

        this.explosionForece = -0.2

        setTimeout( () => {
            this.explosionForece = 0
        }, 100)

    },

    elementPosition() {
        M.engineWorld.world.bodies.forEach( body => {
            if(body.$e){
                if(body.position.x < -10 || body.position.x > M.screenWidth + 10 || body.position.y > M.screenHeight + 10 || body.position.y < -10) {
                    body.$e.remove()
                    M.World.remove(M.engineWorld.world, body)
                    return
                }

                if(M.scrollPosition != $(window).scrollTop()) {
                    let dif = $(window).scrollTop() - M.scrollPosition
                    let force = dif/1000
                    if(dif > 20)
                        M.Body.applyForce(body, {x: body.position.x, y: body.position.y}, {x: 0, y: -force/2})
                    
                    if(dif < -20)
                        M.Body.applyForce(body, {x: body.position.x, y: body.position.y}, {x: 0, y: -force/2})
                }

                let x = body.position.x - (body.$e.innerWidth() / 2)
                let y = body.position.y - (body.$e.innerHeight() / 2) - 9
                body.$e.css({'top': y, 'left': x, transform: `rotate(${body.angle}rad)`})
            }
        })

        M.scrollPosition = $(window).scrollTop()
    },

    clear() {
        let clear = []
        M.engineWorld.world.bodies.forEach( body => {
            if(!body.isStatic)
                clear.push(body)
        })

        M.engineWorld.world.constraints.forEach( constrain => {
            if(constrain.label != 'Mouse Constraint')
                clear.push(constrain)
        })

        M.World.remove(M.engineWorld.world, clear)
    },

    string(x, y, body) {
        let sling = this.Constraint.create({
            pointA: {
                x: x,
                y: y
            },
            bodyB: body,
            stiffness: 0.3,
            length: 150,
            render: {
                type: 'line',
                strokeStyle: '#000'
            }
        })
        this.World.add(this.engineWorld.world, sling)
    }
}

$(() => {
    M.init()
    M.start()

    let bodyString = false

    $(document).on('click', '.releasable.matter, .releasableCircle.matter, .releasableText.matter', ({currentTarget}) => {
        const $e = $(currentTarget)
        if(M.tool == "string" && !bodyString) {
            setTimeout(() => {bodyString = $e.data('body')}, 100)
        }
    })

    $('.releasable').on('click', ({currentTarget}) => {
        const $e = $(currentTarget)

        if($e.hasClass('transparent') || $e.hasClass('matter'))
            return
        
        const $copy = $e.clone().addClass('matter')

        $e.addClass('transparent').after($copy)

        M.addBox($e.position(), [$e.innerWidth(), $e.innerHeight()], $copy)
    })

    $('.releasableCircle').on('click', ({currentTarget}) => {
        const $e = $(currentTarget)

        if($e.hasClass('transparent') || $e.hasClass('matter'))
            return
        
        const $copy = $e.clone().addClass('matter')

        $e.addClass('transparent').after($copy)

        M.addCircle($e.position(), $e.innerWidth()/2, $copy)
    })

    $('.releasableText').on('click', ({currentTarget}) => {
        const $e = $(currentTarget)

        if($e.hasClass('transparent') || $e.hasClass('matter'))
            return
        
        //For each word create an element
        const $copy = $e.clone().addClass('matter')
        $e.addClass('transparent')

        $($copy).html().split(" ").forEach( text => {
            const $split = $copy.clone().html(text)

            $e.after($split)
            M.addBox($split.position(), [$split.innerWidth(), $split.innerHeight()], $split)
        })
    })

    $(document).on('click', (e) => {
        if(M.tool == 'bomb')
            M.boom({x: e.pageX, y: e.pageY})

        if(bodyString !== false) {
            M.string(e.pageX, e.pageY, bodyString)
            bodyString = false
        }
            
    })

    $('.breackMe-toolbar-item').on('click', ({currentTarget}) => {
        $('.breackMe-toolbar-item').removeClass('selected')
        $(currentTarget).addClass('selected')

        let tool = $(currentTarget).attr('tool')

        $('canvas').css("pointer-events", "none")

        if(tool != 'string') 
            bodyString = false

        if(tool == 'grab') {
            $('canvas').css("pointer-events", "all")
            $('#spray').css("pointer-events", "none")
        }
    
        if(tool == 'spray')
            $('#spray').css("pointer-events", "all")

        if(tool == 'reset') {
            $('.transparent').removeClass('transparent')
            $('.matter').remove()
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            M.clear()
        }  

        setTimeout(() => {M.tool = tool}, 100)
        
    })

    $('.colorPicker input').on('change', ({currentTarget}) => {
        $('.colorPicker').css("background-color", $(currentTarget).val())
        ctx.strokeStyle = $(currentTarget).val()
    })

    //Desenha
    var canvas = document.querySelector('#spray');
    var ctx = canvas.getContext('2d');
    
    canvas.width = $('body').width()
    canvas.height = $('body').height()

    var mouse = {x: 0, y: 0};
    var last_mouse = {x: 0, y: 0};

    /* Mouse Capturing Work */
    canvas.addEventListener('mousemove', function(e) {
        last_mouse.x = mouse.x;
        last_mouse.y = mouse.y;

        mouse.x = e.pageX - this.offsetLeft;
        mouse.y = e.pageY - this.offsetTop;
    }, false);


    /* Drawing on Paint App */
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    canvas.addEventListener('mousedown', function(e) {
        canvas.addEventListener('mousemove', onPaint, false);
    }, false);

    canvas.addEventListener('mouseup', function() {
        canvas.removeEventListener('mousemove', onPaint, false);
    }, false);

    var onPaint = function() {
        if(M.tool !== "spray")
            return
        ctx.beginPath();
        ctx.moveTo(last_mouse.x, last_mouse.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.closePath();
        ctx.stroke();
    };

    //Explosão
    $('body').on('click', function(e) {
        if(M.tool != 'bomb')
            return
        explode(e.pageX, e.pageY);
    })
    
    // explosion construction
    function explode(x, y) {
        var particles = 50,
        // explosion container and its reference to be able to delete it on animation end
        explosion = $('<div class="explosion"></div>');
    
        // put the explosion container into the body to be able to get it's size
        $('body').append(explosion);
        
        // position the container to be centered on click
        explosion.css('left', x - explosion.width() / 2);
        explosion.css('top', y - explosion.height() / 2);
        
        for (var i = 0; i < particles; i++) {
            // positioning x,y of the particle on the circle (little randomized radius)
            var x = (explosion.width() / 2) + rand(80, 150) * Math.cos(2 * Math.PI * i / rand(particles - 10, particles + 10)),
            y = (explosion.height() / 2) + rand(80, 150) * Math.sin(2 * Math.PI * i / rand(particles - 10, particles + 10)),

            color = 214 + ', ' + rand(32, 196) + ', ' + 32, // randomize the color rgb
                // particle element creation (could be anything other than div)
            elm = $('<div class="particle" style="' +
                'background-color: rgb(' + color + ') ;' +
                'top: ' + y + 'px; ' +
                'left: ' + x + 'px"></div>');
        
            if (i == 0) { // no need to add the listener on all generated elements
            // css3 animation end detection
            elm.one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function(e) {
                explosion.remove(); // remove this explosion container when animation ended
            });
            }
            explosion.append(elm);
        }
    }
    
    // get random number between min and max value
    function rand(min, max) {
        return Math.floor(Math.random() * (max + 1)) + min;
    }
})